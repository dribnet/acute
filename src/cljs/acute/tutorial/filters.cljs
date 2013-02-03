(ns acute.tutorial.filters
  (:require [acute :refer [angular]]))

(-> angular
  (.module "phonecatFilters" [])
  (.filter "checkmark" (fn [] #(if % "\u2713" "\u2718"))))
