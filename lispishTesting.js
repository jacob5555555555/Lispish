lispish(`
           (let [[twice (fn [f] (fn [arg] (f (f arg))))]]
                ((twice (fn [a] (+ 1 a)))
                        4))
`)