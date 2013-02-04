(ns acute.tutorial.app
  (:require [cljs.reader :refer [read-string]]
            [acute :refer [angular bootstrap]]
            [acute.tutorial.controllers :refer [PhoneListCtrl PhoneDetailCtrl]]))

(bootstrap)

(let [app (-> angular
                (.module "phonecat" ["phonecatFilters"]))]
  (-> app
    (.config 
      ["$routeProvider" (fn [$routeProvider]
        (-> $routeProvider
          (.when "/phones" {:templateUrl "partials/phone-list.html"
                            :controller PhoneListCtrl})
          (.when "/phones/:phoneId" {:templateUrl "partials/phone-detail.html"
                                     :controller PhoneDetailCtrl})
          (.otherwise {:redirectTo "/phones"})))]))
  (-> app
    (.config 
     ["$httpProvider" (fn [$httpProvider]
        (set! (-> $httpProvider .-defaults .-transformResponse)
          (fn [x]
            ; FIXME: challenge - given a string, is it edn?
            ; (this is only a little cheesier than the angular impl)
            (if (and (string? x)
                  (or (re-find #"^\{\:" x) (re-find #"^\[\{" x)))
              (read-string x)
              x))))])))
