from datetime import datetime
from hashlib import sha256
from secrets import token_urlsafe as make_nonce
from sys import stderr

import requests

from app.models import LookupMatches, LookupTodo
from engine.answers import ask, search_fragments


def give_answer(
    engine: str,
    token: str,
    topic: str,
    user: str,
    seq: int,
    query: str,
    model: str = "default",
    collections: list[str] = ["SEIU-contracts", "UCB-Labor-Center"],
) -> None:
    nonce = make_nonce(16)
    hash = sha256(f"{engine} {nonce} {token}".encode()).hexdigest()
    think, answer, seq, _seconds = ask(query, topic, user, model, collections)
    response = requests.post(
        "https://api.bossbot.org/api/give-new-answer",
        params={"User": engine, "Nonce": nonce, "Hash": hash},
        json={
            "Query": query,
            "Topic": topic,
            "Seq": seq,
            "Think": think,
            "Answer": answer,
        },
    )
    now = datetime.now().isoformat(timespec="seconds")
    if response.status_code == 200:
        print(f"{now} Posted query answer for {topic}[{seq}]", file=stderr, flush=True)
    else:
        print(
            f"{now} Failed to post query answer for {topic}[{seq}]",
            file=stderr,
            flush=True,
        )


def poll_queries(engine: str, token: str) -> None:
    nonce = make_nonce(16)
    hash = sha256(f"{engine} {nonce} {token}".encode()).hexdigest()
    response = requests.get(
        "http://api.bossbot.org/api/get-new-queries",
        params={"User": engine, "Nonce": nonce, "Hash": hash},
    )
    now = datetime.now().isoformat(timespec="seconds")
    if response.status_code == 401:
        print(f"{now} Authentication failed", file=stderr, flush=True)

    elif response.status_code == 200:
        data = response.json()
        if data["Topic"] is not None:
            print(f"{now} {data}", file=stderr, flush=True)
            topic = data["Topic"]
            for Q in data["Queries"]:
                seq, (query, user, model) = Q.popitem()
                give_answer(engine, token, topic, user, seq, query, model)


def poll_lookups(engine: str, token: str) -> None:
    nonce = make_nonce(16)
    hash = sha256(f"{engine} {nonce} {token}".encode()).hexdigest()
    response = requests.get(
        "https://api.bossbot.org/api/get-new-lookup",
        params={"User": engine, "Nonce": nonce, "Hash": hash},
    )
    now = datetime.now().isoformat(timespec="seconds")
    if response.status_code == 401:
        print(f"{now} Authentication failed", file=stderr, flush=True)

    elif response.status_code == 404:
        # No new lookups to process, no need to print anything
        pass

    elif response.status_code == 200:
        _fragment = response.json()
        fragment = LookupTodo(
            Fingerprint=_fragment["Fingerprint"],
            Fragment=_fragment["Fragment"],
            Count=_fragment["Count"],
            Threshold=_fragment["Threshold"],
        )
        results = search_fragments(
            fragment.Fragment, fragment.Count, fragment.Threshold
        )
        print(
            f"{now} Identified {len(results)} matches "
            f"for fragment {fragment.Fingerprint}",
            file=stderr,
            flush=True,
        )
        lookup_matches = LookupMatches(
            Fingerprint=fragment.Fingerprint, Matches=[r.doc for r in results]
        )
        nonce = make_nonce(16)
        hash = sha256(f"{engine} {nonce} {token}".encode()).hexdigest()
        response = requests.post(
            "https://api.bossbot.org/api/give-new-matches",
            params={"User": engine, "Nonce": nonce, "Hash": hash},
            json=lookup_matches.model_dump(),
        )
