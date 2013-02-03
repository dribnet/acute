(ns acute.tutorial
  (:require [acute :refer [placeholder]]))

(defn ^:export PhoneListCtrl [$scope, $http]
  (-> $http (.get "phones/phones.json")
    (.success 
      (fn [data]
        ; importing edn file directly would be better than
        ; calling js->clj on a json, but I don't want to get
        ; too distracted installing an "$http reponse transform"
        ; yet -- http://docs.angularjs.org/api/ng.$http
        (aset $scope "phones" (js->clj data :keywordize-keys true))
        ; (-> js/gdebug (set! (aget $scope "phones")))
        ; (.log js/console (str (aget $scope "phones")))
      )))
  (aset $scope "orderProp" "age")
)
