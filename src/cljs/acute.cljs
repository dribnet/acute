(ns acute
  (:require [mrhyde :refer [patch-known-arrayish-types 
                            patch-known-mappish-types 
                            patch-return-value-to-clj
                            patch-args-keyword-to-fn]]))

(this-as t (.log js/console (str "hello " t)))
