(ns acute.tutorial
  (:require [acute :refer [placeholder]]))

(defn ^:export PhoneListCtrl [$scope]
  ; (.log js/console $scope)
  (aset $scope "phones" [
      {:name "Nexus S"
       :snippet "Fast just got faster with Nexus S."
       :age 0
      }
      {:name "Motorola XOOM™ with Wi-Fi"
       :snippet "The Next, Next Generation tablet."
       :age 1
      }
      {:name "MOTOROLA XOOM™"
       :snippet "The Next, Next Generation tablet."
       :age 2
      }
    ])
  (aset $scope "orderProp" "age")
)
  