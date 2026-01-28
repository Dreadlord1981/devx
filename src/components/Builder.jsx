import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";
import Toolbar from "./Toolbar";

function Builder(props) {

	let state = props.state
	let options = props.options || [];
	let setWorking = props.setWorking;

	const logRef = useRef(null);
	const inputRef = useRef(null);

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

	function isValid() {

		let valid = false;

		if (
			state.user &&
			state.ifs &&
			state.password &&
			state.host &&
			state.deploy &&
			state.bin &&
			state.target
		) {
			valid = true;
		}

		return valid && !internalWorking;
	}

	async function onClick() {

		setLog("")
		setInternalWorking(true);
		setWorking(true);

		let o_args = {
			...state
		};

		await invoke("builder", {
			args: o_args
		});
	}

	async function onClearClick() {

		setLog("");
	}

	useEffect(function () {

		invoke("update_title", { title: "Capdev builder" });

		if (inputRef.current) {
			inputRef.current.focus();
		}

		let status = appWindow.listen("icebuilder-status", function (i_response) {

			let o_payload = i_response.payload;

			updatestatus(o_payload);
		});

		let error = appWindow.listen("icebuilder-error", function (i_response) {

			let o_payload = i_response.payload;

			updatestatus(o_payload, true);
		});

		let done = appWindow.listen("icebuilder-done", function (i_response) {

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
						<legend>Info</legend>
						<div className="field-wrapper">
							<label className="field-label" htmlFor="build">Type:</label>
							<select className="field-input" onChange={props.onInputChange} value={state.type} name="build">
								{options.length > 0 &&
									options.map(function (o_config) {
										return <option key={o_config.value} value={o_config.value} selected={o_config.selected}>{o_config.label}</option>
									})
								}
							</select>
						</div>
						<div className="field-wrapper">
							<label className="field-label" htmlFor="target">Target:</label>
							<input className="field-input" onChange={props.onInputChange} value={state.target} name="target"></input>
						</div>
					</fieldset>
					<fieldset disabled={internalWorking}>
						<legend>Server</legend>
						<div className="field-wrapper">
							<label className="field-label" htmlFor="host">Host:</label>
							<input className="field-input" ref={inputRef} onChange={props.onInputChange} value={state.host} name="host"></input>
						</div>
						<div className="field-wrapper">
							<label className="field-label" htmlFor="user">User:</label>
							<input className="field-input" onChange={props.onInputChange} value={state.user} name="user"></input>
						</div>
						<div className="field-wrapper">
							<label className="field-label" htmlFor="password">Password:</label>
							<input className="field-input" onChange={props.onInputChange} value={state.password} type="password" name="password"></input>
						</div>
						<div className="field-wrapper">
							<label className="field-label" htmlFor="ifs">IFS:</label>
							<input className="field-input" onChange={props.onInputChange} value={state.ifs} name="ifs"></input>
						</div>
						<div className="field-wrapper">
							<label className="field-label" htmlFor="deploy">Deploy library:</label>
							<input className="field-input" onChange={props.onInputChange} value={state.deploy} name="deploy"></input>
						</div>
						<div className="field-wrapper">
							<label className="field-label" htmlFor="bin">Bin library:</label>
							<input className="field-input" onChange={props.onInputChange} value={state.bin} name="bin"></input>
						</div>
						<div className="field-wrapper">
							<label className="field-label" htmlFor="release">Release:</label>
							<input type="checkbox" onChange={props.onInputChange} checked={state.release} className="field-input" name="release"></input>
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
			<Toolbar onClearClick={onClearClick} onClick={onClick} valid={isValid()} />
		</div>
	);
}

export default Builder;
