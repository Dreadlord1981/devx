import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";
import Toolbar from "./Toolbar";

function Server(props) {

	let state = props.state
	let servers = state.servers;
	let configs = state.configs;
	let server = state.server;
	let config = state.config;
	let cache = state.cache;
	let setWorking = props.setWorking;

	const logRef = useRef(null);
	const inputRef = useRef(null);

	const [internalWorking, setInternalWorking] = useState(false);
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

	function isCacheSelected(b_value) {

		return cache == b_value;
	}

	function isValid() {

		let serverSelected = false;
		let configSelected = false;

		servers.forEach(function (o_sever) {

			if (!serverSelected) {
				serverSelected = isSelected(o_sever.name);
			}
		});

		configs.forEach(function (o_config) {

			if (!configSelected) {
				configSelected = isConfigSelected(o_config.name);
			}
		});

		return serverSelected && configSelected && !internalWorking;
	}

	async function onClick() {

		setLog("")
		setInternalWorking(true);
		setWorking(true);

		let o_args = {
			path: state.path,
			config: state.config,
			port: state.port,
			server: state.server,
			https: state.https,
			cache: state.cache
		};

		await invoke("run_server", {
			args: o_args
		});
	}

	async function onClearClick() {

		setLog("");
	}

	useEffect(function () {

		invoke("update_title", { title: "Server manager" });

		if (inputRef.current) {
			inputRef.current.focus();
		}

		let status = appWindow.listen("server-status", function (i_response) {

			let o_payload = i_response.payload;

			updatestatus(o_payload);
		});

		let error = appWindow.listen("server-error", function (i_response) {

			let o_payload = i_response.payload;

			updatestatus(o_payload, true);
		});

		let done = appWindow.listen("server-done", function (i_response) {

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
						<legend>Server</legend>
						<div className="field-wrapper">
							<label className="field-label" htmlFor="path">Path:</label>
							<input className="field-input" ref={inputRef} onChange={props.onInputChange} value={state.path} name="path"></input>
						</div>
					</fieldset>
					{servers.length > 0 &&
						<fieldset disabled={internalWorking}>
							<legend>Servers</legend>
							{
								servers.map(function (o_config) {
									return <div key={o_config.name} className="field-wrapper">
										<label className="field-label" htmlFor={o_config.name}>{o_config.name}</label>
										<input type="checkbox" checked={isSelected(o_config.name)} onChange={props.onServerChange} className="field-input" name={o_config.name}></input>
									</div>
								})
							}
						</fieldset>
					}
					{configs.length > 0 &&
						<fieldset disabled={internalWorking}>
							<legend>Configs</legend>
							{
								configs.map(function (o_config) {
									return <div key={o_config.name} className="field-wrapper">
										<label className="field-label" htmlFor={o_config.name}>{o_config.name}</label>
										<input type="checkbox" checked={isConfigSelected(o_config.name)} onChange={props.onConfigChange} className="field-input" name={o_config.name} port={o_config.port} mode={o_config.https ? 1 : 0}></input>
									</div>
								})
							}
						</fieldset>
					}
					<fieldset disabled={internalWorking}>
						<legend>Caching</legend>
						<div className="field-wrapper">
							<label className="field-label" htmlFor="no-cache-input">No cache:</label>
							<input type="radio" checked={isCacheSelected(false)} className="field-input" onChange={props.onServerCacheChange} id="no-cache-input" value="0" name="cache"></input>
						</div>
						<div className="field-wrapper">
							<label className="field-label" htmlFor="cache-input">Cache:</label>
							<input type="radio" checked={isCacheSelected(true)} className="field-input" onChange={props.onServerCacheChange} id="cache-input" value="1" name="cache"></input>
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

export default Server;
