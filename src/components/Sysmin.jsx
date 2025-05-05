import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";
import Navigation from "./Navigation";

function Sysmin(props) {

    let state = props.state
    let options = props.options || [];

    const logRef = useRef(null);
    const [working, setWorking] = useState(false);
    const [log, setLog] = useState("");

    function updatestatus(o_payload, b_done) {
        let s_result = o_payload.message;
        if (o_payload.update) {
            var a_lines = log.split("\n");
            a_lines = a_lines.filter(Boolean)
            if(a_lines[a_lines.length -1] != "") {
                a_lines.pop();
                a_lines.push(o_payload.message);
            }
            s_result = a_lines.join("\n");
        }
        else {
            s_result = [
                log,
                s_result
            ].join("")
        }
        setLog(s_result);
        if (b_done) {
            setWorking(false);
        }
    }

    async function onClick() {
        setLog("")
        setWorking(true);
        let o_args = {
            ...state
        };
        await invoke("sysmin", {
            args: o_args
        });
    }
	
    async function onClearClick() {
        setLog("");
    }

    useEffect(function() {

        let i_promise = invoke("update_title", {title: "System minifier"});

        let status = appWindow.listen("sysmin-status", function(i_response) {
            let o_payload = i_response.payload;
            updatestatus(o_payload);
        });

        let error = appWindow.listen("sysmin-error", function(i_response) {
            let o_payload = i_response.payload;
            updatestatus(o_payload, true);
        });

        let done = appWindow.listen("sysmin-done", function(i_response) {
            let o_payload = i_response.payload;
            updatestatus(o_payload, true);
        });

        const scrollHeight = logRef.current.scrollHeight;
        const height = logRef.current.clientHeight;
        const maxScrollTop = scrollHeight - height;

        logRef.current.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;

        return () => {
            status.then(function(f_callback) {
                f_callback();
            });
            error.then(function(f_callback) {
                f_callback();
            });
            done.then(function(f_callback) {
                f_callback();
            });
        }

    }, [log])

    let portfolio = <input type="radio" className="field-input" onChange={props.onInputChange} id="system-p" value="p" name="system"></input>;
    let icecap = <input type="radio" className="field-input" onChange={props.onInputChange} id="system-i" value="i" name="system"></input>;

    if (state.system == "i") {
        icecap = <input type="radio" className="field-input" onChange={props.onInputChange} id="system-i" value="i" name="system" checked></input>
    }
    if (state.system == "p") {
        portfolio = <input type="radio" className="field-input" onChange={props.onInputChange} id="system-p" value="p" name="system" checked></input>
    }
	
    return (
        <>
            <Navigation active={"sysmin"} working={working}/>
            <div className="container">
                <div className="layout-hbox flex">
                    <div className="form flex">
                        <fieldset disabled={working}>
                            <legend>System</legend>
                            <div className="field-wrapper">
                                <label className="field-label" htmlFor="system-i">Icecap:</label>
                                {icecap}
                            </div>
                            <div className="field-wrapper">
                                <label className="field-label" htmlFor="system-p">Portfolio:</label>
                                {portfolio}
                            </div>
                        </fieldset>
                    </div>
                    <div className="layout-fit flex">
                        <div className="output flex" ref={logRef}>
                            <pre>
                                {log}
                            </pre>
                        </div>
                    </div>
                </div>
                <div className="toolbar">
                    <div className="tbfill" />
                    <button disabled={working} onClick={onClearClick}>Clear</button>
                    <button disabled={working} className="primary" onClick={onClick}>Ok</button>
                </div>
            </div>
        </>
    );
}
export default Sysmin;