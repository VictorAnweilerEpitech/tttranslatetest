function initTTTranslator(conf) {
    if (!conf.key) {
        console.error('TTTranslator: key is required')
    }

    // Conf
    var lang = null
    var baseUrl = 'http://localhost:3000'
    let projectId = conf.key
    let ttSelector = conf.selector || '.tt'

    // Set lang
    if (localStorage.getItem('tt-lang')) {
        lang = localStorage.getItem('tt-lang')
    } else {
        lang = conf.lang || 'fr'
    }

    // Get default texts
    let getTexts = () => {
        if (projectId) {
            // Add all attribute keys
            let htmlEls = document.querySelectorAll(ttSelector);
            let textKey = null
            for (let htmlEl of htmlEls) {
                if (!htmlEl.getAttribute('tttranslate-key')) {
                    textKey = htmlEl.innerHTML
                    htmlEl.setAttribute('tttranslate-key', textKey)
                    htmlEl.innerHTML = ''
                }
            }

            const xhrGetText = new XMLHttpRequest();
            xhrGetText.open("GET", baseUrl + "/api/translate/texts?id=" + projectId + "&lang=" + lang, true);
            xhrGetText.send();
            xhrGetText.responseType = "json";
            xhrGetText.onload = () => {
                if (xhrGetText.readyState == 4 && xhrGetText.status == 200) {
                    const ttTexts = xhrGetText.response;

                    // Replace all text by new value
                    let htmlEls = document.querySelectorAll('[tttranslate-key]');
                    let textKey = null
                    for (let htmlEl of htmlEls) {
                        textKey = htmlEl.getAttribute('tttranslate-key')
                        if (ttTexts[textKey]) {
                            htmlEl.innerHTML = ttTexts[textKey]
                        } else {
                            createNewTranslation(textKey, htmlEl)
                        }
                    }
                } else {
                    console.error(`tt translate: ${xhrGetText.status} | Please contact support`);
                }
            };
        }
    }
    getTexts()

    // Create translation
    let createNewTranslation = (newText, htmlEl) => {
        if (projectId) {
            var xhrNewText = new XMLHttpRequest();
            var url = baseUrl + '/api/translate/add';
            var params = {
                "project_id": projectId,
                "content": newText
            };
            xhrNewText.open('POST', url, true);
            xhrNewText.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')
            xhrNewText.send(JSON.stringify(params));
            xhrNewText.onreadystatechange = function() {
                if (xhrNewText.readyState == 4 && xhrNewText.status == 200) {
                    htmlEl.setAttribute('tttranslate-key', newText)

                    let response = JSON.parse(xhrNewText.response);
                    htmlEl.innerHTML = response[columnName(lang)]
                }
            }
        }
    }

    // Tools
    let columnName = (lang => {
        if (lang) {
            lang = lang.toLowerCase()
            let columnName = null
            switch (lang) {
                case 'en-gb':
                    columnName = 'en_gb'
                    break;
                case 'en-us':
                    columnName = 'en_us'
                    break;
                case 'pt-br':
                    columnName = 'pt_br'
                    break;
                case 'pt-pt':
                    columnName = 'pt_pt'
                    break;
                default:
                    columnName = lang
                    break;
            }
            return 'lang_' + columnName
        }
    })

    // Magic button
    if (conf.magicBtn) {
        let buttonLangEl = document.querySelector(conf.magicBtn)
        if (buttonLangEl) {
            // Get langs
            const xhrGetText = new XMLHttpRequest();
            xhrGetText.open("GET", baseUrl + "/api/language/project?id=" + projectId, true);
            xhrGetText.send();
            xhrGetText.responseType = "json";
            xhrGetText.onload = () => {
                if (xhrGetText.readyState == 4 && xhrGetText.status == 200) {
                    const ttLangs = xhrGetText.response;

                    // Create select button
                    let btnSelectEl = buttonLangEl.appendChild(document.createElement("select"))
                    btnSelectEl.setAttribute('class', buttonLangEl.getAttribute('class'))
                    btnSelectEl.setAttribute('style', 'outline: none' + buttonLangEl.getAttribute('style'))
                    buttonLangEl.setAttribute('class', '')
                    buttonLangEl.setAttribute('style', '')
                    let options = null                    
                    ttLangs.forEach((ttLang) => {
                        options = btnSelectEl.appendChild(document.createElement("option"))
                        options.setAttribute('value', ttLang.code)
                        options.innerHTML = ttLang.label
                    })

                    // Detect change
                    if (btnSelectEl) {
                        btnSelectEl.addEventListener('change', function() {
                            lang = this.value
                            getTexts()
                            localStorage.setItem('tt-lang', lang)
                        });
                        if (localStorage.getItem('tt-lang')) {
                            let buttonLangOptionsEl = document.querySelector(conf.magicBtn + " select option[value='" + lang + "']")
                            if (buttonLangOptionsEl) {
                                buttonLangOptionsEl.setAttribute("selected", 1)
                            }
                        }
                    }
            
                } else {
                    console.error(`tt translate: ${xhrGetText.status} | Please contact support`);
                }
            };
        }
    }
}

let TTTranslator = {
    init: initTTTranslator
}