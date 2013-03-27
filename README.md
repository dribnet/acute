# acute

This is an example of how [strokes](https://github.com/dribnet/strokes) can be used for interop with the [angularjs library](http://angularjs.org/).

Currently there is just a port of the [angular tutorial](http://docs.angularjs.org/tutorial/). This version of the tutorial also replaces all json files with edn files so that all [phone data](public/phones/) is provided by clojurescript container classes. This demo can also be [viewed online](http://dribnet.github.com/acute/public/).

Note: This is just a proof of concept implementation. See [clang](https://github.com/pangloss/clang/) for a more thought out approach.

## Usage

```
lein cljsbuild auto
cd public && ./web_server.sh
open http://localhost:7878/
```

## License

[WTFPL](http://www.wtfpl.net/)
