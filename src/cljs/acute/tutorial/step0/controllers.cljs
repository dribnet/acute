(ns acute.tutorial.step0
  (:require [acute :refer [placeholder]]))

(defn PhoneListCtrlIdeal [scope]
  (aset scope "phones" [
      {:name "Nexus S"
       :snippet "Fast just got faster with Nexus S."}
      {:name "Motorola XOOM™ with Wi-Fi"
       :snippet "The Next, Next Generation tablet."}
      {:name "MOTOROLA XOOM™"
       :snippet "The Next, Next Generation tablet."}
    ]))

(defn PhoneListCtrl [scope]
  (.log js/console scope)
  (aset scope "hello" "Hello CLJS World"))

(defn BareBonesCtrl [$scope]
  ; (.log js/console $scope)
  (aset $scope "phones" [
      {:name "Nexus S"
       :snippet "Fast just got faster with Nexus S."}
      {:name "Motorola XOOM™ with Wi-Fi"
       :snippet "The Next, Next Generation tablet."}
      {:name "MOTOROLA XOOM™"
       :snippet "The Next, Next Generation tablet."}
    ])
  (aset $scope "hello" "hello CLJS world"))
