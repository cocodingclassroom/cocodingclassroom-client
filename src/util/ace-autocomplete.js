// add to editor.setOptions({})
// for parsing autocomplete:
export const loadAutoComplete = (langTools, binding) => {
    // propose trimmed list/script to https://github.com/processing/p5.js/issues/3666
    let acList = []
    let curFunction = ''
    let acOBJ = binding.getAutoCompleteJson()
    let bindingName = binding.bindingName

    // cycle through auto complete list
    acOBJ.code.forEach(function (ac) {
        // if method/function
        if (ac.t === 'm') {
            // add once without params for easy adding
            if (ac.n !== curFunction) {
                acList.push({ cap: ac.n + '()', snip: ac.n + '()' })
                curFunction = ac.n
            }

            // add w/ params using tab feature
            let acParamsTab = []
            for (let i = 0; i < ac.p.length; i++) {
                acParamsTab.push('${' + (i + 1) + ':' + ac.p[i] + '}')
            }
            let acParamsListTab = ac.n + '(' + acParamsTab.join(', ') + ')'
            let acParamsList = ac.n + '(' + ac.p.join(', ') + ')'
            acList.push({ cap: acParamsList, snip: acParamsListTab })
        } else {
            // add constants/misc
            acList.push({ cap: ac.n, snip: ac.n })
        }
    })

    // create custom completer
    let completer = {
        getCompletions: function (editor, session, pos, prefix, callback) {
            let text = editor.getValue()
            if (prefix.length === 0) {
                callback(null, [])
                return
            }
            var completions = []
            for (let wl of acList) {
                completions.push({
                    caption: wl.cap,
                    snippet: wl.snip,
                    meta: bindingName,
                    score: 1,
                })
            }
            callback(null, completions)
        },
    }

    // add list to auto completer
    langTools.addCompleter(completer)
}
