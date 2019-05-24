# CubeTester

A nodejs command line tool for testing calc time of Qlik hypercubes. Motivation is to benchmark and play with cube performance. 

## Installation

Clone or download this repo and then install npm packages.
```
npm i
```

## Available Function

There are two primary commands implemented. 
* `test` - Execute tests, specified in file input, and report on the results. 
* `extract` - Extract Chart Dimensions and Measures from an app in the format expected by the `test` command. 

## Usage

```console
node index.js <command>

Commands:
  index.js test <infile>            Run tests from test input file
  index.js extract <app> <outfile>  Extract tests from application

Options:
  --help          Show help 
  --version       Show version number
  --app, -a       App Id for Desktop, App GUID for Server.
  --endpoint, -e  Websocket endpoint used when connecting to Qlik Desktop/Server.  [default: "ws://localhost:9076/"]
  --useCache      Uses standard engine caching. [default: false]
  --trace         Display socket trace to stdout. [default: false]
  --user, -u      User name used when connecting to Qlik Server. [default: currentuser]
  --domain, -d    User domain used when connecting to Qlik Server. [default: currentdomain]
  --certPath, -c  Path to certificates used when connecting to Qlik Server.
                  Must include these files: client.pem, client_key.pem, and
                  root.pem
  --repeat        Number of times to peform each test  [default: 1]
  --testSyntax, --ts  For extract command, syntax to use for generated tests.
                      "simple" for simplified syntax, "full" for full qHyperCubeDef.  [default: "simple"]
```
## Test Specification 
A test specification consists of an array of Testcase objects.

### Testcase properties
* `target` - Optional target object, Testcase level.
    * Any properties that can be specified as command line options - app, endpoint, etc.
* `tests`  - Array of Test objects
    * `name` - Name for the test.
    * `dimensions` - Array of string dimension names.
    * `measures` - Array of string measure expressions.
    * `qHyperCubeDef` - HyperCubeDef
    * `target` - Optional target object, Test level.
           * Any properties that can be specified as command line options - app, endpoint, etc.

Each test should use either `dimensions` and `measures` ("simplified syntax") or `qHyperCubeDef` ("full syntax"), but not both.
### Example Testcase

```json
[
    { 
        "target" : {
            "app" : "MSQ Performance Sample App"
        },
        "tests" : [
            {   "name" : "Variable Expression",
                "dimensions": ["Customer"],
                "measures" : ["$(vSales) ", "$(vQuantity)", "$(vSales) / $(vQuantity)"]
            }, 
            {   "name" : "Repeat Expression",
                "dimensions": ["Customer"],
                "measures" : ["Sum(LineTotal) ", "Sum(OrderQty)", "Sum(LineTotal) / Sum(OrderQty)"]
            },
            {   "name" : "Column Expression",
                "dimensions": ["Customer"],
                "measures" : ["Sum(LineTotal) ", "Sum(OrderQty)", "column(1) / column(2)"],
            }
        ]
    }
]
```

## Contributing
Pull requests are welcome. 

## License
[MIT](https://choosealicense.com/licenses/mit/)