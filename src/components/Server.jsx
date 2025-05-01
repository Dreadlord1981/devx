import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";
import Navigation from "./Navigation";


function Server(props) {

	let state = props.state
	let servers = state.servers;
	let configs = state.configs;
	let server = state.server;
	let config = state.config;

	const logRef = useRef(null);
	const inputRef = useRef(null);

	const [working, setWorking] = useState(false);
	const [log, setLog] = useState("");

	function isSelected(s_value) {

		return server == s_value;
	}

	function isConfigSelected(s_value) {

		return config == s_value;
	}

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
			path: state.path,
			config: state.config,
			server: state.server
		};

		await invoke("run_server", {
			args: o_args
		});
	}

	async function onClearClick() {

		setLog("");
	}

	useEffect(function() {

		let i_promise = invoke("update_title", {title: "Capdev Run server"});

		if (inputRef) {
			inputRef.current.focus();
		}

		let status = appWindow.listen("server-status", function(i_response) {

			let o_payload = i_response.payload;

			updatestatus(o_payload);
		});

		let error = appWindow.listen("server-error", function(i_response) {

			let o_payload = i_response.payload;

			updatestatus(o_payload, true);
		});

		let done = appWindow.listen("server-done", function(i_response) {
			
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

	return (
		<>
			<Navigation active={"server"}/>
			<div className="container">
				<div className="layout-hbox flex">
					<form className="form flex">
						<fieldset disabled={working}>
							<legend>Server</legend>
							<div className="field-wrapper">
								<label className="field-label" htmlFor="path">Path:</label>
								<input className="field-input" ref={inputRef} onChange={props.onInputChange} value={state.path} name="path"></input>
							</div>
						</fieldset>
						{servers.length > 0 &&
							<fieldset disabled={working} className="overflow-auto max-height">
								<legend>Servers</legend>
								{
									servers.map(function(o_config) {
										return <div key={o_config.name} className="field-wrapper">
											<input type="checkbox" checked={isSelected(o_config.name)} onChange={props.onServerChange} className="field-input maring-right-20" name={o_config.name}></input>
											<label className="field-label" htmlFor={o_config.name}>{o_config.name}</label>
										</div>
									})
								}
							</fieldset>
						}
						{configs.length > 0 &&
							<fieldset disabled={working} className="flex overflow-auto">
								<legend>Configs</legend>
								{
									configs.map(function(o_config) {
										return <div key={o_config.name} className="field-wrapper">
											<input type="checkbox" checked={isConfigSelected(o_config.name)} onChange={props.onConfigChange} className="field-input maring-right-20" name={o_config.name}></input>
											<label className="field-label" htmlFor={o_config.name}>{o_config.name}</label>
										</div>
									})
								}
							</fieldset>
						}
					</form>
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

export default Server;