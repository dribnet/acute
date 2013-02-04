(ns acute.tutorial.controllers
  (:require [cljs.reader :refer [read-string]]
            [acute :refer [angular]]))

; memo - would be great to wrap these aset/aget calls in something
; but for now that's not my main focus

(defn PhoneListCtrl [$scope, $http]
  (-> $http (.get "phones/phones.edn")
    (.success 
      (fn [data]
        (aset $scope "phones" data))))
  (aset $scope "orderProp" "age"))

(defn PhoneDetailCtrl [$scope, $routeParams, $http]
  (-> $http (.get (str "phones/" (aget $routeParams "phoneId") ".edn"))
    (.success 
      (fn [data]
        (aset $scope "phone" data)
        (aset $scope "mainImageUrl" (first (:images data))))))
  (aset $scope "setImage" #(aset $scope "mainImageUrl" %)))

