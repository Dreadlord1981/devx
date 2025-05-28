import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";
import Navigation from "./Navigation";

function Exporter(props) {

	let state = props.state;
	let selected = props.selected;
	let f_first = props.onFirst;
	let repoes = state.repoes;
	let first = state.first;
	let ftp = state.ftp;

	const logRef = useRef(null);
	const inputRef = useRef(null);

	const [working, setWorking] = useState(false);
	const [log, setLog] = useState("");

	function isSelected(s_value) {

		var b_found = false;

		selected.forEach(function(s_search) {
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
			setWorking(false);
		}

	}

	async function onClick() {

		setLog("");
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

	useEffect(function() {

		let i_promise = invoke("update_title", {title: "Git repo Exporter"});

		if (inputRef) {
			inputRef.current.focus();
		}

		let status = appWindow.listen("exporter-status", function(i_response) {

			let o_payload = i_response.payload;

			updatestatus(o_payload);
		});

		let error = appWindow.listen("exporter-error", function(i_response) {

			let o_payload = i_response.payload;

			updatestatus(o_payload);
		});

		let done = appWindow.listen("exporter-done", function(i_response) {
			
			let o_payload = i_response.payload;

			updatestatus(o_payload, true);
		});
		

		if (first) {
			f_first();
		}

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

	return (
		<>
			<Navigation active={"exporter"} working={working}/>
			<div className="container">
				<div className="layout-hbox flex">
					<div className="form flex">
						<fieldset disabled={working}>
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
						<fieldset disabled={working}>
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
							<fieldset disabled={working} className="flex overflow-auto">
								<legend>Repository</legend>
								{
									repoes.map(function(o_config) {
										return <div key={o_config.name} className="field-wrapper">
											<input type="checkbox" checked={isSelected(o_config.name)} onChange={props.onRepoChange} className="field-input maring-right-20" name={o_config.name}></input>
											<label className="field-label" htmlFor={o_config.name}>{o_config.name}</label>
										</div>
									})
								}
							</fieldset>
						}
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
	)
}

export default Exporter