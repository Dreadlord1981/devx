import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";
import Toolbar from "./Toolbar";

function Sysmin(props) {

	let state = props.state
	let setWorking = props.setWorking;

	const logRef = useRef(null);
	const [internalWorking, setInternalWorking] = useState(false);
	const [log, setLog] = useState("");

	function updatestatus(o_payload, b_done) {
		let s_result = o_payload.message;
		if (o_payload.update) {
			var a_lines = log.split("\n");
			a_lines = a_lines.filter(Boolean)
			if (a_lines[a_lines.length - 1] != "") {
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
			setInternalWorking(false);
			setWorking(false);
		}
	}

	async function onClick() {
		setLog("")
		setInternalWorking(true);
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

	useEffect(function () {

		invoke("update_title", { title: "System minifier" });

		let status = appWindow.listen("sysmin-status", function (i_response) {
			let o_payload = i_response.payload;
			updatestatus(o_payload);
		});

		let error = appWindow.listen("sysmin-error", function (i_response) {
			let o_payload = i_response.payload;
			updatestatus(o_payload, true);
		});

		let done = appWindow.listen("sysmin-done", function (i_response) {
			let o_payload = i_response.payload;
			updatestatus(o_payload, true);
		});

		if (logRef.current) {
			const scrollHeight = logRef.current.scrollHeight;
			const height = logRef.current.clientHeight;
			const maxScrollTop = scrollHeight - height;
			logRef.current.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
		}

		return () => {
			status.then(function (f_callback) {
				f_callback();
			});
			error.then(function (f_callback) {
				f_callback();
			});
			done.then(function (f_callback) {
				f_callback();
			});
		}

	}, [log])

	return (
		<div className="container">
			<div className="content-wrapper">
				<div className="form-area">
					<fieldset disabled={internalWorking}>
						<legend>System</legend>
						<div className="field-wrapper">
							<label className="field-label" htmlFor="system-i">Icecap:</label>
							<input type="radio" className="field-input" onChange={props.onInputChange} id="system-i" value="i" name="system" checked={state.system === "i"}></input>
						</div>
						<div className="field-wrapper">
							<label className="field-label" htmlFor="system-p">Portfolio:</label>
							<input type="radio" className="field-input" onChange={props.onInputChange} id="system-p" value="p" name="system" checked={state.system === "p"}></input>
						</div>
					</fieldset>
				</div>
				<div className="output-area">
					<div className="output-header">Logs</div>
					<div className="output" ref={logRef}>
						<pre>{log}</pre>
					</div>
				</div>
			</div>
			<Toolbar onClearClick={onClearClick} onClick={onClick} valid={!internalWorking} />
		</div>
	);
}
export default Sysmin;
