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

		const s_message = o_payload.message || "";

		if (o_payload.update) {
			setLog(function (s_prev) {
				const n_count = (s_message.match(/\n/g) || []).length + 1;
				let n_pos = s_prev.length;
				for (let i = 0; i < n_count; i++) {
					const n_next = s_prev.lastIndexOf("\n", n_pos - 1);
					if (n_next === -1) {
						n_pos = -1;
						break;
					}
					n_pos = n_next;
				}
				return (n_pos === -1 ? "" : s_prev.substring(0, n_pos + 1)) + s_message;
			});
		}
		else {
			setLog(function (s_prev) {
				return s_prev + s_message;
			});
		}
		if (b_done) {
			setInternalWorking(false);
			setWorking(false);
		}
	}

	async function onClick() {
		setLog("")
		setInternalWorking(true);
		setWorking(true);

		let s_list = (state.list || "").split(/\s+/).filter(Boolean).join(" ");
		let s_boot = (state.boot || "").split(/\s+/).filter(Boolean).join(" ");

		let o_args = {
			...state,
			list: s_list,
			boot: s_boot
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
					{state.system === "p" && (
						<fieldset className="fieldset-flex" disabled={internalWorking}>
							<legend>Boot</legend>
							<div className="field-wrapper">
								<textarea 
									className="field-input" 
									name="boot" 
									style={{ fontFamily: 'monospace' }}
									placeholder="Enter boot files separated by spaces or newlines..."
									value={state.boot}
									onChange={props.onInputChange}
								/>
							</div>
						</fieldset>
					)}
					<fieldset className="fieldset-flex" disabled={internalWorking}>
						<legend>Files</legend>
						<div className="field-wrapper">
							<textarea 
								className="field-input" 
								name="list" 
								style={{ fontFamily: 'monospace' }}
								placeholder="Enter files separated by spaces or newlines..."
								value={state.list}
								onChange={props.onInputChange}
							/>
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
