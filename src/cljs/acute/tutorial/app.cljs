(ns acute.tutorial.app
  (:require [acute :refer [angular bootstrap]]
            [acute.tutorial.controllers :refer [PhoneListCtrl PhoneDetailCtrl]]))

(bootstrap)

(-> angular
  (.module "phonecat" ["phonecatFilters"])
  (.config 
    ["$routeProvider" (fn [$routeProvider]
      (-> $routeProvider
        (.when "/phones" {:templateUrl "partials/phone-list.html"
                          :controller PhoneListCtrl})
        (.when "/phones/:phoneId" {:templateUrl "partials/phone-detail.html"
                                   :controller PhoneDetailCtrl})
        (.otherwise {:redirectTo "/phones"}))
    )])
)
