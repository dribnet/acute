(ns acute
  (:require [mrhyde :refer [patch-known-arrayish-types 
                            patch-known-mappish-types 
                            patch-tostring-hydearray-is-array
                            restore-original-js-fn
                            patch-return-value-to-clj
                            patch-args-keyword-to-fn
                            hyde-array?
                            get-store-cur-js-fn]]))

(def angular (this-as ct (aget ct "angular")))

(defn ^:export preshow []
  ; tell anyone that asks that clj sequential types are really arrays
  ; (patch-tostring-hydearray-is-array)

  ; (defn patch-tostring-sequential-isarray [o field-name]
  (let [o (-> js/Object .-prototype) 
        field-name "toString"
        orig-fn (aget o field-name)]
    (.log js/console (str "installing " o "," field-name))
    (aset o field-name
      (fn [& args]
        (this-as ct
          (if (hyde-array? ct) (do
            ; (.log js/console (str "match for: " ct))
            "[object Array]"
          )
           ;else
          (.apply orig-fn ct args)))
      ))
  )
  ; other future init here...
  (.log js/console "acute preshow complete.")
)


(defn ^:export bootstrap []
  ; first restore object.tostring
  ; (restore-original-js-fn (-> js/Object .-prototype) "toString")

  ; patch all seqs to also be read-only arrays for javascript interop
  (patch-known-arrayish-types)
  ; patch maps to include key based accessors on js object
  (patch-known-mappish-types)
  ; other future init here...
  (.log js/console "acute bootstrapped complete."))