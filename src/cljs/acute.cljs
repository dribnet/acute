(ns acute
  (:require [mrhyde.core :as mrhyde]))

(def angular (this-as ct (aget ct "angular")))

(defn ^:export bootstrap []
  (mrhyde/bootstrap))
