function tokenize(code){
	return code
		.replace(/\(/g, " ( ")
		.replace(/\)/g, " ) ")
		.replace(/\[/g, " [ ")
		.replace(/\]/g, " ] ")
		.replace(/\{/g, " { ")
		.replace(/\}/g, " } ")
		.replace(/\\b/, " ")
		.split(/\s+/)
		.filter(Boolean);
}

function matchingDelim(str){
	switch(str){
		case "(": return ")";
		case "{": return "}";
		case "[": return "]";
	}
	return null;
}

function tokToObject(token){
    if (token === "NaN"){
        return NaN;
    } else {
        var asNum = Number(token);
        if (asNum){
            return asNum;
        } else {//is symbol
            return token;
        }
    }
}

function parse(tokens){
    if (tokens[0] != "(" || tokens[tokens.length - 1] != ")"){
        throw new Error("first and last token must be parenthasis");
    }
    return parseImpl(tokens.splice(1, tokens.length - 2));
}

function parseImpl(tokens){
	var startVal = {findingSub: false, result:[]};
	return tokens.reduce(function(soFar, next){
		if(soFar.findingSub){
			if (next === soFar.startDelim){
				soFar.delimDepth += 1;
			} else if (next === soFar.endDelim){
				soFar.delimDepth -= 1;
			}

			if (soFar.delimDepth === 0){
				soFar.findingSub = false;
				soFar.result.push(parseImpl(soFar.inSub));
			} else {
				soFar.inSub.push(tokToObject(next));
			}
		}else{
			var delim = matchingDelim(next);
			if (delim){
				soFar.findingSub = true;
				soFar.delimDepth = 1;
				soFar.endDelim = delim;
				soFar.startDelim = next;
				soFar.inSub = [];
				if (delim === "]"){
				    soFar.inSub.push("list");
				} else if (delim === "}"){
				    soFar.inSub.push("hash")
				}
			} else {
				//push representation of next instead of next
				soFar.result.push(next);
			}
		}

		return soFar;
	}, startVal).result;
}

var jsMacros = {
    fn: function(elements){
        var argList = elements[0];
        var code = elements[1];
        if (argList[0] !== "list"){
            throw Error("first arg of fn must be list but is" + argList[0]);
        }
        var args = argList.splice(1);
        args.forEach(function(arg){
            if (arg.constructor !== String){
                throw Error("element of list after fn must be tokens");
            }
        })
        return "(function(" + args.join(",") + "){return " + compile(code, jsMacros) + ";})";
    },
    list: function(elements){
        var list = elements.map(function(arg){
            return compile(arg, jsMacros);
        });
        return JSON.stringify(list);
    },
    "+": function(elements){
        return "(" + elements.join("+") + ")";
    }
}

function compile(tokens, jsMacros){
    if (tokens.constructor === Array){
        // var compiledToks = tokens.map(function(token){
        //     return compile(token, jsMacros);
        // });
        var first = tokens[0];
        var macro = jsMacros[first];
        if (macro){
            return macro(tokens.splice(1));
            //TODO: do check for if macro has right number of args
        } else {
            throw new Error("Macro unrecognised: " + first);
        }
    } else if (tokens.constructor === Number){
        return String(tokens);
    } else if (tokens.constructor === String){
        return tokens;
    } else {
        throw new Error("this shouldn't happen");
    }
}

// function compile(tokens, jsMacros){
//     return tokens.map(function(tok){
//         return compileImpl(tok, jsMacros);
//     });
// }
// function compileImpl(tokens, jsMacros){//runs on single list of tokens
//     var macro = jsMacros[tokens[0]];
//     if (!macro){
//         throw Error("Illegal macro: " + tokens[0]);
//     } else {
//         macro.run(tokens.splice(1));
//     }
//     return tokens.map(function(tok){
//         return
//     })
// }