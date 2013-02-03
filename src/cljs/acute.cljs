(ns acute
  (:require [mrhyde :refer [patch-known-arrayish-types 
                            patch-known-mappish-types 
                            patch-tostring-hydearray-is-array
                            restore-original-js-fn
                            patch-return-value-to-clj
                            patch-args-keyword-to-fn
                            hyde-array?
                            hyde-array-slice
                            hyde-array-splice
                            hyde-array-push
                            hyde-array-sort]]))

(def angular (this-as ct (aget ct "angular")))

(defn ^:export isArray [x]
  (if (hyde-array? x)
    true
    (= (.call (-> js/Object .-prototype .-toString) x) "[object Array]"))
)

; this was not necessary. stashing for now
; (def emptyArray (array))
; (defn ^:export arraySlice [s & args]
;   (.log js/console (str "slice : " s "," args))
;   (if (hyde-array? s)
;     (apply hyde-array-slice (cons s args))
;     (.apply (-> emptyArray .-slice) s args))
; )

(defn ^:export bootstrap []
  ; patch all seqs to also be read-only arrays for javascript interop
  (patch-known-arrayish-types)
  ; patch maps to include key based accessors on js object
  (patch-known-mappish-types)
  ; other future init here...
  (.log js/console "acute bootstrapped complete."))