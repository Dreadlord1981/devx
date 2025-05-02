import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";
import Navigation from "./Navigation";


function Creatator(props) {

	let state = props.state
	let packages = state.extends || [];
	let projects = state.projects || [];

	let selected = state.selected || [];
	let project_selected = state.project_selected || [];

	let logchange = props.logchange || [];

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

	function isSelected(s_value) {

		var b_found = false;

		selected.forEach(function(s_search) {
			if (s_search == s_value) {
				b_found = true;
			}
		});

		return b_found;
	}

	function isProjectSelected(s_value) {

		var b_found = false;

		project_selected.forEach(function(s_search) {
			if (s_search == s_value) {
				b_found = true;
			}
		});

		return b_found;
	}

	async function onClick() {

		setLog("")
		setWorking(true);

		let o_args = {
			name: state.name,
			project: state.project_selected.join(""),
			extends: state.selected.join("")
		};

		await invoke("create_theme", {
			args: o_args
		});
	}

	async function onClearClick() {

		setLog("");
	}

	useEffect(function() {

		let i_promise = invoke("update_title", {title: "Theme creator"});

		if (inputRef) {
			inputRef.current.focus();
		}

		let status = appWindow.listen("creator-status", function(i_response) {

			let o_payload = i_response.payload;

			updatestatus(o_payload);
		});

		let error = appWindow.listen("creator-error", function(i_response) {

			let o_payload = i_response.payload;

			updatestatus(o_payload, true);
		});

		let done = appWindow.listen("creator-done", function(i_response) {
			
			let o_payload = i_response.payload;

			updatestatus(o_payload, true);
		});

		const scrollHeight = logRef.current.scrollHeight;
		const height = logRef.current.clientHeight;
		const maxScrollTop = scrollHeight - height;
		logRef.current.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;

		if (state.extends.length == 0 || state.projects.length == 0) {

			props.getProjectConfig();
		}

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
			<Navigation active={"creator"} working={working}/>
			<div className="container">
				<div className="layout-hbox flex">
					<form className="form flex">
						<fieldset disabled={working}>
							<legend>Create theme</legend>
							<div className="field-wrapper">
								<label className="field-label" htmlFor="name">Name:</label>
								<input className="field-input" ref={inputRef} onChange={props.onInputChange} value={state.name} name="name"></input>
							</div>
						</fieldset>
						{projects.length > 0 &&
							<fieldset disabled={working} className="flex overflow-auto">
								<legend>Project</legend>
								{
									projects.map(function(s_name) {
										return <div key={s_name} className="field-wrapper">
											<input type="checkbox" checked={isProjectSelected(s_name)} onChange={props.onProjectChange} className="field-input maring-right-20" name={s_name}></input>
											<label className="field-label" htmlFor={s_name}>{s_name}</label>
										</div>
									})
								}
							</fieldset>
						}
						{packages.length > 0 &&
							<fieldset disabled={working} className="flex overflow-auto">
								<legend>Extend</legend>
								{
									packages.map(function(o_config) {
										return <div key={o_config.name} className="field-wrapper">
											<input type="checkbox" checked={isSelected(o_config.name)} onChange={props.onCheckChange} className="field-input maring-right-20" name={o_config.name}></input>
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

export default Creatator;