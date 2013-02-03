(ns acute.tutorial.step0
  (:require [acute :refer [placeholder]]))

(defn ^:export PhoneListCtrl [$scope]
  (.log js/console $scope)
  (aset $scope "phones" (apply array [
      {:name "Nexus S"
       :snippet "Fast just got faster with Nexus S."}
      {:name "Motorola XOOM™ with Wi-Fi"
       :snippet "The Next, Next Generation tablet."}
      {:name "MOTOROLA XOOM™"
       :snippet "The Next, Next Generation tablet."}
    ]))
  (aset $scope "hello" "hello CLJS world"))
