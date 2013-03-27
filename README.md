# acute

This is an example of how [strokes](https://github.com/dribnet/strokes) can be used for interop with the angular library.

Currently there is just a port of the [angular tutorial](http://docs.angularjs.org/tutorial/). This version of the tutorial also replaces all json files with edn files so that phone data is provided by clojurescript data. This demo can also be [viewed online](http://dribnet.github.com/acute/).

## Usage

lein cljsbuild auto
cd public && ./web_server.sh
open http://localhost:7878/tutorial/

## License

[WTFPL](http://www.wtfpl.net/)
