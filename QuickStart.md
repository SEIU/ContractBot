# Getting started deploying ContractBot

## Architecture Summary

ContractBot consists of three major hardware components, each with a
corresponding software stack:

- An "Inference Engine" is a physical machine with a reasonably powerful GPU
  to perform LLM inference. Code relevant to this component lives under the
  `engine/` directory.

- A backend is a physical machine running a FastAPI server that provides
  several routes. Code relevant to this component lives under the `app/`
  directory.

- A frontend is a physical machine running a React server and creating a
  single-page interface for interacting with the system. Code relevant to
  this component lives under the `react/` directory.

It is very reasonable, and even recommended, to host the backend and frontend
on the same physical machine. The SEIU IU deployment runs on an AWS EC2
t3.small instance, supporting both FastAPI and React servers.

The bulk of the computational load relies on one or more engines. We
**strongly recommend** that every Inference Engine is a physical machine owned
and controlled by the implementer of a ContractBot instance, and **not** a
cloud-hosted instance under the control of an external entity.

## Install uv

Package management in ContractBot is handled with
[`uv`](https://docs.astral.sh/uv/getting-started/installation/). You can
install `uv` with:

```sh
curl -LsSf https://astral.sh/uv/install.sh | sh
```

From there, generally all development and deployment should start with:

```
$ uv sync
$ source .venv/bin/activate
```

In the relevant directories.

In general, we recommend using `uv` for *all* Python-related software
development.  It's simply much better than all previous tooling for package
management and virtual environment management.

## Deploying an Inference Engine

By design, an Inference Engine that may contain proprietary information, or
even PII, is isolated from general external access. It performs its work by
calling a backend frequently to inquire whether additional work is available
to perform. After queries are provided by the backend, another route is
called once an answer is computed.

Within the SEIU IU deployment, our initial Inference Engine is a Mac Studio
(M3 Ultra, 60-core GPU, 96 GiB). The only port exposed is SSH over 443, and a
small number of public keys are contained in its `.ssh/authorized_keys`. No
domain name is associated with the Inference Engine, only an IP address.

An Engine must have [Ollama](https://github.com/ollama/ollama) installed.
On Linux doing this is as simple as running the following while logged into
that machine.

```sh
curl -fsSL https://ollama.com/install.sh | sh
```

On macOS or Windows, a download of an [installer](https://ollama.com/download) is needed.

Updating code on the Inference Engine is peformed via `rsync`, and hence only
from one of the few machines with SSH access to the relevant IP address. The
script `bin/to-engine-ssh` is used by SEIU, but will have to be adapted
modestly for a different deployment.

### Running the Engine

The script `engine/watch` will loop forever, and periodically call
`poll_queries()` which in turn calls `give_answer()` once an answer is
computed. The functions each call routes on the backend to obtain or provide
the actual data.

The script `./inference.sh` performs a few tasks prior to launching
`engine/watch`. It uses Ollama to install several models, then archives
previous data, configures log file location, and restarts the watcher. The
heart of script is simply:

```sh
nohup engine/watch 2>>$INFERENCE_LOG &
```

You may wish to modify details of `inference.sh` and/or launch `engine/watch`
directly; such changes are straightforward.

The script `engine/watch` begins by attempting to load environment variables
from `$HOME/.bot.yaml`.  Such a file resembles the below (use better
passwords, of course):

```sh
bossbot|Infererence> cat $HOME/.bot.yaml 
ENGINE_NAME_1: Inference_1
ENGINE_TOKEN_1: password1
ENGINE_NAME_2: Inference_2
ENGINE_TOKEN_2: password2
ENGINE_NAME_3: Inference_3
ENGINE_TOKEN_3: password3
ENGINE_NAME_4: Inference_4
ENGINE_TOKEN_4: password4
ENGINE_MODEL: deepseek-r1:32b
TOKENIZERS_PARALLELISM: "true"
```

Any or all fo these environment variables can be set in a different manner
prior to running the inference engine if you prefer; but all must be present
for the engine(s) to run.

### LLM Interaction History

All interactions with the Inference Engine are kept in an SQLite3 database at
`$HOME/.answers.db` on that physical machine. The following columns are
recorded within the `answers` table:

- Topic - A random string that distinguishes topic threads.
- Seq - A one-based counter of queries within the same topic thread.
- User - Who created this query (and was provided the corresponding answer)?
- Timestamp - Second-resolution ISO-8601 datetime when query was received.
- Query - The query provided by the user.
- Answer - The text produced by the underlying LLM in response.
- Model - The name of the LLM used to calculate the answer.
- Seconds - An integer count of the time generating this answer took.

In general, the interactions records in the Engine's DB will be kept
long-term. However, they will not be copied to exposed public locations.

## Deploying the Backend and Frontend Servers

The SEIU IU deployment uses GitHub Actions to deploy both the backend and
frontend. The bulk of the deployment work is performed by the script
`.deploy.sh`, which should run similarly in any deployment environment.

The deployment script rotates logs, kills old processes, installs software
components if needed, and so on. Once initial setup is taken care of, the
backend server is launched with:

```sh
uv run python -m gunicorn [... various flags ...] > \
    $BACKEND_LOG 2>&1 & disown >/dev/null 2>&1
```

The frontend server is similar, using:

```sh
serve -s dist -l 3000 > $FRONTEND_LOG 2>&1 & disown >/dev/null 2>&1
```

### The GitHub Action

You will need to modify the GitHub workflow for a different deployment, and if
you do not use GitHub and/or Actions, the same tasks will be achieved by other
scripts or manual steps. What the workflow does is:

1. Checkout code to a runner. This will later, but does not yet, run tests to
   gate the next steps.
2. Populate the checkout with login credentials for various users (see below).
3. Use `rsync` to transfer the current code from the runner to the deploy
   instance.
4. Run `bin/make-certs` on the deploy instance.
5. Run `./deploy.sh` on the deploy instance.

## Understanding Credentials

Login credentials are manually maintained (and sometimes rotated) during this
development period. The `secrets/credentials` file resembles the following:

```
Inference_1=ascii-beijing-analytical-foam
Frontend_1=preparation-lesbians-deserve-soon
Sara_Chan=employment-legitimate-uganda-case
```

Those are, of course, not real credentials, but share the same form. Later
on, we will probably transition to an OAuth provider and a different
credential system.

Credentials come in three types, as illustrated. Users named `Inference_*`
can only communicate with a subset of relevant routes. Users named
`Frontend_*` can only communicate with a distinct subset of the routes.

The only route that regular users can utilize at all is `GET api/login`. All
further actions are performed on their behalf by a `Frontend_*` "user" which
can access relevant routes. The [Architecture](Architecture.md) document
discusses how the security system works in more detail.

## The RAG Database

A database system called `chromadb` is used to maintain and search vector
representations of fragments of documents that are utilized in enhancing
queries. Retrieval Augmented Generation (RAG) identifies such relevant quotes
(approximately one paragraph each) to inject into each prompt.

The small command-line tool `engine/search` allows you to experiment with
searching fragments based on test queries.

Populating the RAG database is performed with the command-line tool
`engine/mk_db`. This tool provides several switches, but is nonetheless
probably a bit cryptic until you are familiar with it.

```sh
% engine/mk_db --help
Usage: mk_db [OPTIONS]

Options:
  --reset                 Reset the vector database of document chunks
  -f, --filelist TEXT     File with list of files to process, one per line
  -c, --collection TEXT   Name of collection (default 'SEIU- contracts')
  -l, --list-collections  List the existing collections and their sizes
  --delete-collection     Delete a collection (requires confirmation)
  --cosine                Use cosine similarity metric not squared L2 norm
  --inner                 Use inner product metric not squared L2 norm
  -n, --num-docs INTEGER  Limit processing to N files
  -p, --pattern TEXT      Generate 'documents.cfg' from glob pattern
  -v, --verbose           More verbose output
  -?, -h, --help          Show this message and exit.
```

Documents that can be vectorized must be plain text. However, using tools
such as `docx2txt`, `lynx`, or `pdftotext` can be used to convert mostly
textual formats into plain text prior to their inclusion in the RAG database.

### Vectorizing Document Fragments

Vectorization and storage of RAG documents isn't fast. _Retrieval_ of stored
vector matches _is_ fast though. The below design allows for incremental
processing of document collections; typically about 1 second to match 50 best
fragments/chunks.

For example, chunking and processing ~5l initial documents, consisting of ~3M
(overlapping) chunks takes about 8 hours on a CPU-only machine with 16 cores,
and pegs all cores for that entire time. This can probably be done faster on
a system with a good GPU, but requires mucking with some extra libraries
(which I have not yet figured out).

The first step in ingesting RAG documents is to enumerate them into a
configuration file. This is performed with, e.g.:

```sh
% engine/mk_db -p 'assets/text/*.txt'
Created a list of 4,850 files in 'document.cfg'
```

Often you will wish to rename the file `document.cfg` to a more descriptive
name prior to further use of it. This simple configuration format merely
lists files that may be processed. For example:

```sh
% head -3 documents.cfg
assets/text/Milwaukee Master CBA 2015-2018.txt
assets/text/N205 PACE exp2019.txt
assets/text/superior-court-of-butte-county_professional-unit_mou_12.1.2020-11.30.2021.txt
```

While processing files, this configuration is modified to mark files that have
been vectorized, e.g.:

```sh
% head -3 documents.cfg-l2-2025-04-11
[DONE] assets/text/Milwaukee Master CBA 2015-2018.txt
[DONE] assets/text/N205 PACE exp2019.txt
[DONE] assets/text/superior-court-of-butte-county_professional-unit_mou_12.1.2020-11.30.2021.txt
```

When you want to run the vectorization against a document collection—as defined in
a configuration file—you reference the configuration, e.g.:

```sh
% engine/mk_db -f documents.cfg-l2-2025-04-11 2>/dev/null
Processed 1 documents in 6 seconds
Collection SEIU-contracts has 3,369,537 vectors/chunks
```

In the example shown, we discard STDERR. This hides the progress bars, but
in this case also hides hundreds of lines similar to:

```
Insert of existing embedding ID: 345010c8b7155b98452c8034ecbe3c06bd066319
```

There's no _harm_ in re-adding the very same fragment, but there's also no
reason to spend the processing time. Hence the somewhat crude markup of some
files as "[DONE]" allows us to skip repetition. If the vectorization and DB
storage processing is interrupted, all the files actually processed are marked
so within the config file, and the same configuration can be resumed without
loss.
