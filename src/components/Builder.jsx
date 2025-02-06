import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";
import Navigation from "./Navigation";


function Builder(props) {

	let state = props.state
	let options = props.options || [];

	const logRef = useRef(null);
	const inputRef = useRef(null);

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

		await invoke("builder", {
			args: o_args
		});
	}

	async function onClearClick() {

		setLog("");
	}

	useEffect(function() {

		let i_promise = invoke("update_title", {title: "Capdev builder"});

		if (inputRef) {
			inputRef.current.focus();
		}

		let status = appWindow.listen("icebuilder-status", function(i_response) {

			let o_payload = i_response.payload;

			updatestatus(o_payload);
		});

		let error = appWindow.listen("icebuilder-error", function(i_response) {

			let o_payload = i_response.payload;

			updatestatus(o_payload, true);
		});

		let done = appWindow.listen("icebuilder-done", function(i_response) {
			
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
			<Navigation active={"builder"}/>
			<div className="container">
				<div className="layout-hbox flex">
					<form className="form flex">
						<fieldset disabled={working}>
							<legend>Info</legend>
							<div className="field-wrapper">
								<label className="field-label" htmlFor="build">Type:</label>
								<select className="field-input" onChange={props.onInputChange} value={state.type} name="build">
									{options.length > 0 &&
										options.map(function(o_config) {
											return <option key={o_config.value} value={o_config.value} selected={o_config.selected}>{o_config.label}</option>
										})
									}
								</select>
							</div>
						</fieldset>
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

export default Builder;