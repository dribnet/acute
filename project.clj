(defproject acute "0.0.1-SNAPSHOT"
  :description "acute: experimental angular library"
  :dependencies [[org.clojure/clojure "1.4.0"]
                 [net.drib/strokes "0.4.1"]]
  :min-lein-version "2.0.0"
  :source-paths ["src/clj" "src/cljs"]

  :plugins [[lein-cljsbuild "0.2.10"]]

  :cljsbuild {
    :builds [{
      :source-path "src/cljs"
      :compiler {
        :output-to "public/out/acute.js"
        :optimizations :whitespace
        :pretty-print true 
        ; :optimizations :simple
        }}]})
