var $text_box, ConcatenateBlobs, Recognizer, SORTED_SYMBOLS, align_timer, analyserContext, audioChunks, audioContext, audioInput, audioRecorder, capitalize, clipboard, font_size, get_caret_character_offset_within, i, initAudio, init_non_writer_buttons, inited, inputPoint, inspeechend, is_stopped, len, line_height, local_save, paste_html_at_caret, print, rafID, reader, realAudioInput, recIndex, recording, save, sendFreeAudio, send_email, set_caret_position, set_lang, start_writer, stop_writer, symbol, to_doc, to_html, toggleRecording, utter, v, values, writer, zoom;
clipboard = new Clipboard("#copy-content");
clipboard.on("success", function(a) {
    return a.clearSelection()
});
$text_box = $("#text-box").html(localStorage.getItem("recognized_text"));
$("#text-box-container").resizable({
    handles: "se",
    resize: function(b, a) {
        $text_box.outerWidth(a.size.width);
        return $text_box.outerHeight(a.size.height - 5)
    }
});
font_size = parseFloat($text_box.css("font-size"));
line_height = parseFloat($text_box.css("line-height"));
if (!localStorage.getItem("zoom")) {
    localStorage.setItem("zoom", "1")
}
is_stopped = true;
Recognizer = "undefined";
if (typeof SpeechRecognition !== "undefined") {
    Recognizer = SpeechRecognition
} else {
    if (typeof webkitSpeechRecognition !== "undefined") {
        Recognizer = webkitSpeechRecognition
    }
}
zoom = function(b) {
    var a;
    if (b == null) {
        b = 1
    }
    a = parseFloat(localStorage.getItem("zoom")) * b;
    localStorage.setItem("zoom", a);
    return $text_box.css({
        "font-size": font_size * a + "px",
        "line-height": line_height * a + "px"
    })
};
capitalize = function(a) {
    return a.charAt(0).toUpperCase() + a.slice(1)
};
SORTED_SYMBOLS = [];
for (symbol in SYMBOLS) {
    values = SYMBOLS[symbol];
    if (symbol === "↵") {
        symbol = "<br>"
    }
    if (symbol === "↵↵") {
        symbol = "<br><br>"
    }
    for (i = 0, len = values.length; i < len; i++) {
        v = values[i];
        SORTED_SYMBOLS.push([v, symbol]);
        if (v === "Deux-points") {
            SORTED_SYMBOLS.push(["Deux-point", symbol]);
            SORTED_SYMBOLS.push(["2 points", symbol]);
            SORTED_SYMBOLS.push(["2 point", symbol]);
            SORTED_SYMBOLS.push(["2 .", symbol]);
            SORTED_SYMBOLS.push(["2.", symbol])
        }
    }
}
SORTED_SYMBOLS.sort(function(d, c) {
    return c[0].length - d[0].length
});
to_html = function(f) {
    var a, e, c, d, b, h, g;
    h = "";
    for (e = 0, d = f.length; e < d; e++) {
        symbol = f[e];
        if (symbol.charCodeAt(0) === 10) {
            h += "<br>"
        } else {
            h += symbol
        }
    }
    for (c = 0, b = SORTED_SYMBOLS.length; c < b; c++) {
        a = SORTED_SYMBOLS[c];
        g = new RegExp(a[0].replace(/[\s\-]/, "[\\s-]", "gim").replace(/[’']/, "[’']", "gim").replace(/\./, "\\.", "gim"), "gim");
        h = h.replace(g, a[1])
    }
    return h
};
to_doc = function(a) {
    return a.trim().replace(/<br>(<\/br>)?/gi, "\n").replace(/<br[^<>]+>(<\/br>)?/gi, "")
};
get_caret_character_offset_within = function(c) {
    var l, h, k, j, b, f, a, e, g;
    l = 0;
    k = c.ownerDocument || c.document;
    g = k.defaultView || k.parentWindow;
    if (g.getSelection) {
        a = g.getSelection();
        if (a.rangeCount > 0) {
            f = g.getSelection().getRangeAt(0);
            j = f.cloneRange();
            j.selectNode(c);
            j.setEnd(f.endContainer, f.endOffset);
            h = k.createElement("div");
            h.appendChild(j.cloneContents());
            l = h.firstChild.innerHTML.length
        }
    } else {
        if (a = k.selection && a.type !== "Control") {
            e = a.createRange();
            b = k.body.createTextRange();
            b.moveToElementText(c);
            b.setEndPoint("EndToEnd", e);
            l = b.text.length
        }
    }
    return l
};
set_caret_position = function(l, g) {
    var d, n, h, k, f, p, m, c, b, a;
    m = document.createRange();
    b = window.getSelection();
    d = null;
    p = 0;
    c = l.childNodes;
    for (h = 0, k = c.length; h < k; h++) {
        f = c[h];
        d = f;
        a = document.createElement("div");
        a.appendChild(d.cloneNode(true));
        p = a.innerHTML.length;
        if (p < g) {
            g -= p
        } else {
            break
        }
    }
    if (d !== null) {
        try {
            m.setStart(d, g)
        } catch (o) {
            n = o;
            m.setStartAfter(d)
        }
        m.collapse(true);
        b.removeAllRanges();
        return b.addRange(m)
    }
};
paste_html_at_caret = function(g) {
    var d, c, j, a, e, f, h, k, b;
    d = true;
    if (window.getSelection) {
        b = window.getSelection();
        if (b.getRangeAt && b.rangeCount) {
            h = b.getRangeAt(0);
            if ($(h.commonAncestorContainer).closest("#text-box-container").length) {
                h.deleteContents();
                c = document.createElement("div");
                c.innerHTML = g;
                j = document.createDocumentFragment();
                while (e = c.firstChild) {
                    a = j.appendChild(e)
                }
                h.insertNode(j);
                if (a) {
                    h = h.cloneRange();
                    h.setStartAfter(a);
                    h.collapse(true);
                    b.removeAllRanges();
                    b.addRange(h)
                }
                d = false
            }
        }
    }
    if (d) {
        $text_box.html(($text_box.html() + g).replace(/([.?!]\s*)(.)/gim, function(n, l, q, p, m) {
            return l + q.toUpperCase()
        }))
    } else {
        f = get_caret_character_offset_within($text_box.get(0));
        if ($text_box.find("#mirror").length === 0) {
            k = $text_box.html();
            k = k.replace(/^\s+/g, function(m, n, l) {
                f -= m.length;
                return ""
            });
            k = k.replace(/\s+$/g, function(m, n, l) {
                f -= m.length;
                return ""
            });
            k = k.replace(/\n/g, function(m, n, l) {
                f += 3;
                return "<br>"
            });
            k = k.replace(/\s+/g, function(m, n, l) {
                f -= m.length - 1;
                return " "
            });
            k = k.replace(/(\s*)<br>(<\/br>)?(\s*)/gim, function(n, l, r, q, p, m) {
                f -= l.length + q.length;
                return "<br>" + (r || "")
            });
            k = k.replace(/(\s+)([.:?!;,])/gim, function(n, l, q, p, m) {
                f -= l.length;
                return q
            });
            k = k.replace(/([.?!]\s*)(.)/gim, function(n, l, q, p, m) {
                return l + q.toUpperCase()
            });
            k = k.replace(/(<br>)(<\/br>)?([^><])/gim, function(n, l, r, q, p, m) {
                return l + (r || "") + q.toUpperCase()
            });
            $text_box.html(k.charAt(0).toUpperCase() + k.substr(1));
            set_caret_position($text_box.get(0), f)
        }
    }
    return $text_box.scrollTop($text_box.get(0).scrollHeight)
};
save = function(d) {
    var g, h, c, a, f;
    if (d == null) {
        d = "txt"
    }
    a = "content." + d;
    g = to_doc($text_box.html());
    c = new Blob([g], {
        type: "text/plain;charset=utf-8"
    });
    f = document.createElement("a");
    f.download = a;
    f.href = window.URL.createObjectURL(c);
    f.click();
    try {
        return f.parentNode.removeChild(f)
    } catch (b) {
        h = b
    }
};
local_save = function() {
    return localStorage.setItem("recognized_text", $text_box.html())
};
print = function() {
    var c, b, d;
    b = window.open("", "Print", "height=400,width=600");
    c = $("<div></div>");
    d = $text_box.clone();
    d.css({
        "font-size": parseFloat($text_box.css("font-size")) * 1.5 + "px",
        "line-height": parseFloat($text_box.css("line-height")) * 1.5 + "px"
    });
    c.append(d);
    b.document.write("<html>\n<head><title></title></head>\n <body>" + (c.html()) + "</body>\n </html>");
    b.document.close();
    b.focus();
    b.print();
    b.close();
    return true
};
send_email = function() {
    var a;
    a = "mailto:?body=" + (encodeURIComponent(to_doc($text_box.html())));
    return window.open(a, "_blank")
};
init_non_writer_buttons = function() {
    return $(function() {
        var a;
        a = $("[data-toggle='tooltip']");
        a.on("mouseenter", function() {
            var b;
            b = $(this);
            return b.tooltip({
                placement: "auto top",
                trigger: "manual",
                html: true
            }).tooltip("show")
        });
        a.on("mouseleave", function() {
            return $(this).tooltip("hide")
        });
        $("#voice-commands").popover({
            html: true,
            content: function() {
                return $("#voice-commands-content").html()
            },
            placement: function() {
                return "left"
            }
        });
        "$(document).on('click', (e)->\n    $('#voice-commands').each(->\n        if !$(this).is(e.target) and $(this).has(e.target).length == 0 && $('.popover').has(e.target).length == 0\n            (($(this).popover('hide').data('bs.popover') or {}).inState or {}).click = false\n\n  )\n)";
        $("#zoom-in").click(function() {
            return zoom(1.25)
        });
        $("#zoom-out").click(function() {
            return zoom(0.8)
        });
        $("#copy-content").click(function() {
            var b;
            b = $(this);
            b.addClass("copy-done");
            return setTimeout(function() {
                return b.removeClass("copy-done")
            }, 3000)
        });
        $("#print-content").click(function() {
            return print()
        });
        $("#clear-content").click(function() {
            $text_box.html("");
            local_save();
            return audioChunks.length = 0
        });
        $("#save-txt-content").click(function() {
            local_save();
            return save("txt")
        });
        $("#save-word-content").click(function() {
            local_save();
            return save("doc")
        });
        $("#send-content").click(function() {
            return send_email()
        });
        return $text_box.on("click keyup", function() {
            return local_save()
        })
    })
};
if (Recognizer === "undefined") {
    init_non_writer_buttons()
} else {
    writer = new Recognizer();
    writer.continuous = false;
    writer.interimResults = true;
    setInterval(function() {
        var b;
        if (!is_stopped && new Date().getTime() > window.last_timestamp + 3500) {
            try {
                writer.stop();
                writer.start()
            } catch (a) {
                b = a
            }
            return window.last_timestamp = new Date().getTime()
        }
    }, 100);
    writer.onresult = function(h) {
        var b, f, d, g, a, k, c;
        window.last_timestamp = new Date().getTime();
        if (h.results) {
            b = "";
            g = h.results;
            for (f = 0, d = g.length; f < d; f++) {
                a = g[f];
                if (!a.isFinal) {
                    k = a[0].transcript;
                    b += " " + k
                }
            }
            $("#mirror").remove();
            if (a.isFinal) {
                c = to_html(a[0].transcript);
                sendFreeAudio(c);
                paste_html_at_caret(" " + c + " ");
                return local_save()
            } else {
                c = b;
                return paste_html_at_caret("<span id='mirror'>" + c + "</span>")
            }
        }
    };
    set_lang = function(a) {
        return writer.lang = LANGUAGES[a]
    };
    align_timer = null;
    recording = false;
    start_writer = function() {
        is_stopped = false;
        writer.start();
        if (!recording) {
            recording = true;
            window.start_align = new Date().getTime();
            if (!audioRecorder) {
                return initAudio(function() {
                    window.align_shift = 0;
                    return toggleRecording(true)
                })
            } else {
                return toggleRecording(true)
            }
        }
    };
    inspeechend = false;
    stop_writer = function() {
        var a;
        is_stopped = true;
        writer.stop();
        if (recording) {
            recording = false;
            toggleRecording(false);
            a = window.align_shift;
            return window.align_shift = new Date().getTime() - window.start_align + a
        }
    };
    writer.onend = function() {
        if (!is_stopped) {
            return writer.start()
        }
    };
    writer.onspeechend = function() {
        var a;
        inspeechend = true;
        if (recording) {
            toggleRecording(false);
            a = window.align_shift;
            window.align_shift = new Date().getTime() - window.start_align + a
        }
        return inspeechend = false
    };
    if (window.speechSynthesis) {
        reader = window.speechSynthesis;
        reader.cancel();
        utter = new SpeechSynthesisUtterance("");
        inited = false;
        reader.onvoiceschanged = function() {
            var b, a, c, d;
            if (inited) {
                return
            }
            inited = true;
            c = reader.getVoices();
            for (b = 0, a = c.length; b < a; b++) {
                d = c[b];
                if (d.lang.split("-")[0].toLowerCase() === CURRENT_LANGUAGE) {
                    utter.voice = d;
                    utter.lang = d.lang;
                    utter.pitch = 1;
                    utter.volume = 1;
                    utter.rate = 1;
                    break
                }
            }
            return $(window).keyup(function(g) {
                var f, h;
                if (g.which === 9) {
                    f = $("a[tabindex][title]:focus").eq(0);
                    if (f.length) {
                        h = f.attr("title") || f.data("original-title");
                        if (h) {
                            utter.text = h;
                            return reader.speak(utter)
                        }
                    }
                }
            })
        }
    }
    init_non_writer_buttons();
    $(function() {
        var a, c, b;
        $text_box = $("#text-box").html(localStorage.getItem("recognized_text"));
        $("#text-box-container").resizable({
            handles: "se",
            resize: function(f, d) {
                $text_box.outerWidth(d.size.width);
                return $text_box.outerHeight(d.size.height - 5)
            }
        });
        font_size = parseFloat($text_box.css("font-size"));
        line_height = parseFloat($text_box.css("line-height"));
        set_lang(CURRENT_LANGUAGE);
        zoom();
        b = $("#toggle-dictation");
        b.click(function() {
            var f, h, d, j;
            f = $(this);
            f.find("i").toggleClass("fa-play", !is_stopped).toggleClass("fa-stop recording", is_stopped);
            $("#microphone").toggle(is_stopped);
            j = f.attr("data-original-title");
            d = f.attr("data-title-toggled");
            f.attr("data-title-toggled", j);
            f.attr("data-original-title", d);
            if (!is_stopped) {
                stop_writer();
                return a.get(0).pause()
            } else {
                try {
                    return start_writer()
                } catch (g) {
                    h = g
                }
            }
        });
        $(document).keydown(function(d) {
            if (d.altKey || d.metaKey) {
                if (d.which === 68) {
                    b.click();
                    return false
                } else {
                    if (d.which === 88) {
                        $("#clear-content").click();
                        return false
                    } else {
                        if (d.which === 67) {
                            $("#copy-content").click();
                            return false
                        } else {
                            if (d.which === 73) {
                                $("#print-content").click();
                                return false
                            } else {
                                if (d.which === 77) {
                                    $("#send-content").click();
                                    return false
                                }
                            }
                        }
                    }
                }
            }
        });
        a = $("#audio-control");
        c = $("#audio-rate");
        $("#select-file").change(function(g) {
            var d, f;
            f = g.currentTarget;
            d = f.files[0];
            if (f.files && d) {
                reader = new FileReader();
                reader.onload = function(h) {
                    a.attr("src", h.target.result);
                    a.get(0).play();
                    return c.trigger("change")
                };
                return reader.readAsDataURL(d)
            }
        });
        a.get(0).onplaying = function() {
            if (is_stopped) {
                return b.trigger("click")
            }
        };
        a.get(0).onpause = function() {
            if (!is_stopped) {
                return b.trigger("click")
            }
        };
        c.change(function() {
            return a.get(0).playbackRate = $(this).val()
        });
        return $("#transcribe-button").one("click", function() {
            return $(this).next("div").show()
        })
    });
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContext();
    audioInput = null;
    realAudioInput = null;
    inputPoint = null;
    audioRecorder = null;
    rafID = null;
    analyserContext = null;
    recIndex = 0;
    audioChunks = [];
    sendFreeAudio = function(b) {
        var c, a;
        c = null;
        a = false;
        return audioRecorder.exportMonoWAV(function(k) {
            var e, d, h, f, g, l;
            audioChunks.push(k);
            toggleRecording(true);
            h = b.split(/[ ,]+/);
            f = [];
            for (e = 0, d = h.length; e < d; e++) {
                l = h[e];
                g = $("<span class='align-listener'>" + l + " </span>");
                g.attr("queue", audioChunks.length);
                f.push(g.on("click", function() {
                    var n, m, j;
                    if (a) {
                        c.pause();
                        c.currentTime = 0;
                        return a = false
                    } else {
                        if (audioChunks.length > 0) {
                            n = $(this);
                            a = true;
                            j = parseInt(n.attr("queue")) - 1;
                            m = function(o) {
                                var p;
                                if (o < audioChunks.length) {
                                    p = URL.createObjectURL(audioChunks[o]);
                                    c = new Audio(p);
                                    c.play();
                                    return c.onended = function() {
                                        return m(o + 1)
                                    }
                                } else {
                                    return a = false
                                }
                            };
                            return m(j)
                        }
                    }
                }))
            }
            return f
        })
    };
    toggleRecording = function(a) {
        if (!a) {
            return audioRecorder.stop()
        } else {
            if (!audioRecorder) {
                return
            }
            audioRecorder.clear();
            if (audioContext.state === "suspended") {
                audioContext.resume()
            }
            return audioRecorder.record()
        }
    };
    initAudio = function(b, a) {
        if (b == null) {
            b = null
        }
        if (a == null) {
            a = null
        }
        if (!navigator.getUserMedia) {
            navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia
        }
        if (!navigator.cancelAnimationFrame) {
            navigator.cancelAnimationFrame = navigator.webkitCancelAnimationFrame || navigator.mozCancelAnimationFrame
        }
        if (!navigator.requestAnimationFrame) {
            navigator.requestAnimationFrame = navigator.webkitRequestAnimationFrame || navigator.mozRequestAnimationFrame
        }
        return navigator.getUserMedia({
            audio: {
                mandatory: {
                    googEchoCancellation: "false",
                    googAutoGainControl: "false",
                    googNoiseSuppression: "false",
                    googHighpassFilter: "false"
                },
                optional: []
            }
        }, function(c) {
            audioRecorder = new Recorder(audioContext.createMediaStreamSource(c), {
                numChannels: 1
            });
            if (b) {
                return b()
            }
        }, function(c) {
            alert("Error getting audio");
            console.log(c);
            if (a) {
                return a()
            }
        })
    };
    ConcatenateBlobs = function(g, e, f) {
        var b, d, c, a;
        if (g.length === 1) {
            f(g[0]);
            return
        }
        b = [];
        c = 0;
        a = function() {
            if (!g[c]) {
                return d()
            }
            reader = new FileReader();
            reader.onload = function(h) {
                b.push(h.target.result);
                c++;
                return a()
            };
            return reader.readAsArrayBuffer(g[c])
        };
        a();
        return d = function() {
            var j, h, l, k;
            h = 0;
            b.forEach(function(m) {
                return h += m.byteLength
            });
            k = new Uint16Array(h);
            l = 0;
            b.forEach(function(m) {
                var n;
                n = m.byteLength;
                if (n % 2 !== 0) {
                    m = m.slice(0, n - 1)
                }
                k.set(new Uint16Array(m), l);
                return l += n
            });
            j = new Blob([k.buffer], {
                type: e
            });
            return f(j)
        }
    }
};