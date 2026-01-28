import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";
import Toolbar from "./Toolbar";

function Exporter(props) {

	let state = props.state;
	let selected = props.selected;
	let f_first = props.onFirst;
	let repoes = state.repoes;
	let first = state.first;
	let ftp = state.ftp;
	let setWorking = props.setWorking;

	const logRef = useRef(null);
	const inputRef = useRef(null);

	const [internalWorking, setInternalWorking] = useState(false);
	const [log, setLog] = useState("");

	function isSelected(s_value) {

		var b_found = false;

		selected.forEach(function (s_search) {
			if (s_search == s_value) {
				b_found = true;
			}
		});

		return b_found;
	}

	function isFtpSelected(b_value) {

		return ftp == b_value;
	}

	function updatestatus(o_payload, b_done) {

		let s_result = o_payload.message;

		if (o_payload.update) {

			var a_lines = log.split("\n");

			var a_message_lines = o_payload.message.split("\n");

			var n_pop = a_message_lines.length;

			if (n_pop > 0) {

				while (n_pop > 0) {
					a_lines.pop();
					n_pop--;
				}
			}

			a_lines.push(o_payload.message);

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

	function isValid() {

		let valid = false;

		if (
			state.user &&
			state.destination &&
			state.password &&
			state.host &&
			state.path &&
			(
				state.create ||
				state.dist ||
				state.export
			)
		) {

			repoes.forEach(function (o_config) {

				if (!valid) {
					valid = isSelected(o_config.name);
				}
			});
		}

		return valid && !internalWorking;
	}

	async function onClick() {

		setLog("");
		setInternalWorking(true);
		setWorking(true);

		let o_args = {
			...state
		};

		await invoke("exporter", {
			args: o_args
		});
	}

	async function onClearClick() {

		setLog("");
	}

	useEffect(function () {

		invoke("update_title", { title: "Git repo Exporter" });

		if (inputRef.current) {
			inputRef.current.focus();
		}

		let status = appWindow.listen("exporter-status", function (i_response) {

			let o_payload = i_response.payload;

			updatestatus(o_payload);
		});

		let error = appWindow.listen("exporter-error", function (i_response) {

			let o_payload = i_response.payload;

			updatestatus(o_payload);
		});

		let done = appWindow.listen("exporter-done", function (i_response) {

			let o_payload = i_response.payload;

			updatestatus(o_payload, true);
		});


		if (first) {
			f_first();
		}

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
							<input className="field-input" onChange={props.onInputChange} type="password" value={state.password} name="password"></input>
						</div>
						<div className="field-wrapper">
							<label className="field-label" htmlFor="destination">Destination:</label>
							<input className="field-input" onChange={props.onInputChange} value={state.destination} name="destination"></input>
						</div>
					</fieldset>
					<fieldset disabled={internalWorking}>
						<legend>Action</legend>
						<div className="field-wrapper">
							<label className="field-label" htmlFor="path">Path:</label>
							<input onChange={props.onPathChange} value={state.path} className="field-input" name="path"></input>
						</div>
						<div className="field-wrapper">
							<label className="field-label" htmlFor="create">Create:</label>
							<input type="checkbox" onChange={props.onCheckChange} checked={state.create} className="field-input" name="create"></input>
						</div>
						<div className="field-wrapper">
							<label className="field-label" htmlFor="dist">Dist:</label>
							<input type="checkbox" onChange={props.onCheckChange} checked={state.dist} className="field-input" name="dist"></input>
						</div>
						<div className="field-wrapper">
							<label className="field-label" htmlFor="export">Export:</label>
							<input type="checkbox" onChange={props.onCheckChange} checked={state.export} className="field-input" name="export"></input>
						</div>
						<div className="field-wrapper">
							<label className="field-label" htmlFor="ftp-input">FTP:</label>
							<input type="radio" checked={isFtpSelected(true)} className="field-input" onChange={props.onFtpChange} id="ftp-input" value="1" name="ftp"></input>
						</div>
						<div className="field-wrapper">
							<label className="field-label" htmlFor="ssh-input">SSH:</label>
							<input type="radio" checked={isFtpSelected(false)} className="field-input" onChange={props.onFtpChange} id="ssh-input" value="0" name="ftp"></input>
						</div>
					</fieldset>
					{repoes.length > 0 &&
						<fieldset disabled={internalWorking}>
							<legend>Repository</legend>
							{
								repoes.map(function (o_config) {
									return <div key={o_config.name} className="field-wrapper">
										<label className="field-label" htmlFor={o_config.name}>{o_config.name}</label>
										<input type="checkbox" checked={isSelected(o_config.name)} onChange={props.onRepoChange} className="field-input" name={o_config.name}></input>
									</div>
								})
							}
						</fieldset>
					}
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
	)
}

export default Exporter;
