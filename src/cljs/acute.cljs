(ns acute
  (:require [mrhyde :refer [patch-known-arrayish-types 
                            patch-known-mappish-types 
                            patch-tostring-hydearray-is-array
                            patch-return-value-to-clj
                            patch-args-keyword-to-fn
                            get-store-cur-js-fn]]))

(def angular (this-as ct (aget ct "angular")))

(declare patch-seq-is-array)

(defn bootstrap []
  ; patch all seqs to also be read-only arrays for javascript interop
  (patch-known-arrayish-types)
  ; patch maps to include key based accessors on js object
  (patch-known-mappish-types)
  ; tell anyone that asks that clj sequential types are really arrays
  (patch-tostring-hydearray-is-array)
  ; other future init here...
  (.log js/console "acute bootstrapped..."))