import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";
import Toolbar from "./Toolbar";

function Creator(props) {

	let state = props.state
	let packages = state.extends || [];
	let projects = state.projects || [];
	let create = state.create;
	let generate = state.generate;

	let selected = state.selected || [];
	let projects_selected = state.projects_selected || [];

	let setWorking = props.setWorking;

	const logRef = useRef(null);
	const inputRef = useRef(null);

	const [internalWorking, setInternalWorking] = useState(false);
	const [log, setLog] = useState("");

	function isValid() {

		let valid = false;
		let packageSelected = false;
		let projectSelected = false;

		if (generate) {
			packages.forEach(function (o_config) {

				if (!packageSelected) {
					packageSelected = isSelected(o_config.name);
				}
			});

			projects.forEach(function (s_name) {

				if (!projectSelected) {
					projectSelected = isProjectSelected(s_name);
				}
			});

			valid = packageSelected && projectSelected;
		}
		else {
			valid = state.name ? true : false;
		}

		if (!state.path) {
			valid = false;
		}

		return valid && !internalWorking;
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

	function isSelected(s_value) {

		var b_found = false;

		selected.forEach(function (s_search) {
			if (s_search == s_value) {
				b_found = true;
			}
		});

		return b_found;
	}

	function isProjectSelected(s_value) {

		var b_found = false;

		projects_selected.forEach(function (s_search) {
			if (s_search == s_value) {
				b_found = true;
			}
		});

		return b_found;
	}

	async function onClick() {

		setLog("")
		setInternalWorking(true);
		setWorking(true);

		let o_args = {
			name: state.name,
			path: state.path,
			project: state.projects_selected.join(""),
			extends: state.selected,
			create: state.create
		};

		await invoke("create_theme", {
			args: o_args
		});
	}

	async function onClearClick() {

		setLog("");
	}

	useEffect(function () {

		invoke("update_title", { title: "Project creator" });

		if (inputRef.current) {
			inputRef.current.focus();
		}

		let status = appWindow.listen("creator-status", function (i_response) {

			let o_payload = i_response.payload;

			updatestatus(o_payload);
		});

		let error = appWindow.listen("creator-error", function (i_response) {

			let o_payload = i_response.payload;

			updatestatus(o_payload, true);
		});

		let done = appWindow.listen("creator-done", function (i_response) {

			let o_payload = i_response.payload;

			updatestatus(o_payload, true);
		});

		if (logRef.current) {
			const scrollHeight = logRef.current.scrollHeight;
			const height = logRef.current.clientHeight;
			const maxScrollTop = scrollHeight - height;
			logRef.current.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
		}

		if (state.extends.length == 0 || state.projects.length == 0) {

			props.getProjectConfig();
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
						<legend>Options</legend>
						<div key="create" className="field-wrapper">
							<label className="field-label" htmlFor="create">Create project</label>
							<input type="checkbox" checked={create} onChange={props.onOptionChange} className="field-input" name="create"></input>
						</div>
						<div key="generate" className="field-wrapper">
							<label className="field-label" htmlFor="generate">Generate theme</label>
							<input type="checkbox" checked={generate} onChange={props.onOptionChange} className="field-input" name="generate"></input>
						</div>
					</fieldset>

					{create &&
						<fieldset disabled={internalWorking}>
							<legend>Project</legend>
							<div className="field-wrapper">
								<label className="field-label" htmlFor="path">Path:</label>
								<input className="field-input" ref={inputRef} onChange={props.onInputChange} value={state.path} name="path"></input>
							</div>
							<div className="field-wrapper">
								<label className="field-label" htmlFor="name">Name:</label>
								<input className="field-input" onChange={props.onInputChange} value={state.name} name="name"></input>
							</div>
						</fieldset>
					}

					{generate &&

						<>
							<fieldset disabled={internalWorking} className="hidden">
								<legend>Project</legend>
								<div className="field-wrapper">
									<label className="field-label" htmlFor="path">Path:</label>
									<input className="field-input" ref={inputRef} onChange={props.onInputChange} value={state.path} name="path"></input>
								</div>
								<div className="field-wrapper">
									<label className="field-label" htmlFor="name">Name:</label>
									<input className="field-input" ref={inputRef} onChange={props.onInputChange} value={state.name} name="name"></input>
								</div>
							</fieldset>
							{projects.length > 0 &&
								<fieldset disabled={internalWorking}>
									<legend>Project</legend>
									{
										projects.map(function (s_name) {
											return <div key={s_name} className="field-wrapper">
												<label className="field-label" htmlFor={s_name}>{s_name}</label>
												<input type="checkbox" checked={isProjectSelected(s_name)} onChange={props.onProjectChange} className="field-input" name={s_name}></input>
											</div>
										})
									}
								</fieldset>
							}
							{packages.length > 0 &&
								<fieldset disabled={internalWorking}>
									<legend>Extend</legend>
									{
										packages.map(function (o_config) {
											return <div key={o_config.name} className="field-wrapper">
												<label className="field-label" htmlFor={o_config.name}>{o_config.name}</label>
												<input type="checkbox" checked={isSelected(o_config.name)} onChange={props.onExtendChange} className="field-input" name={o_config.name}></input>
											</div>
										})
									}
								</fieldset>
							}
						</>
					}

				</div>
				<div className="output-area">
					<div className="output-header">Logs</div>
					<div className="output" ref={logRef}>
						<pre>
							{log}
						</pre>
					</div>
				</div>
			</div>
			<Toolbar onClearClick={onClearClick} onClick={onClick} valid={isValid()} />
		</div>
	);
}

export default Creator;
