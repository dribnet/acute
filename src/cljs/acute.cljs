(ns acute
  (:require [mrhyde :refer [patch-known-arrayish-types
                            patch-known-mappish-types
                            hyde-array?]]))

(def angular (this-as ct (aget ct "angular")))

(defn ^:export isArray [x]
  (if (hyde-array? x)
    true
    (= (.call (-> js/Object .-prototype .-toString) x) "[object Array]"))
)

(defn ^:export bootstrap []
  ; patch all seqs to also be read-only arrays for javascript interop
  (patch-known-arrayish-types)
  ; patch maps to include key based accessors on js object
  (patch-known-mappish-types))
