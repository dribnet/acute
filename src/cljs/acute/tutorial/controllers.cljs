(ns acute.tutorial.controllers
  (:require [acute :refer [angular]]))

; memo - would be great to wrap these aset/aget calls in something
; but for now that's not my main focus

; memo2 about $http:
; importing edn file directly would be better than
; calling js->clj on a json, but I don't want to get
; too distracted installing an "$http reponse transform"
; yet -- http://docs.angularjs.org/api/ng.$http

(defn PhoneListCtrl [$scope, $http]
  (-> $http (.get "phones/phones.json")
    (.success 
      (fn [data]
        (aset $scope "phones" (js->clj data :keywordize-keys true))
      )))
  (aset $scope "orderProp" "age")
)

(defn PhoneDetailCtrl [$scope, $routeParams, $http]
  (-> $http (.get (str "phones/" (aget $routeParams "phoneId") ".json"))
    (.success 
      (fn [data]
        (let [cdata (js->clj data :keywordize-keys true)]
          (aset $scope "phone" cdata)
          (aset $scope "mainImageUrl" (first (:images cdata)))
        )
      )))
  (aset $scope "setImage" #(aset $scope "mainImageUrl" %))
)
