import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";
import Navigation from "./Navigation";


function Theme(props) {

	let state = props.state
	let packages = props.packages;
	let selected = props.selected;
	let logchange = props.logchange;

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

	async function onClick() {

		setLog("")
		setWorking(true);

		let s_packages = selected.join(" ");

		let o_args = {
			...state
		};

		o_args.packages = s_packages;

		await invoke("packer", {
			args: o_args
		});
	}

	async function onClearClick() {

		setLog("");
	}

	useEffect(function() {

		let i_promise = invoke("update_title", {title: "Theme builder / exporter"});

		if (inputRef) {
			inputRef.current.focus();
		}

		let status = appWindow.listen("theme-status", function(i_response) {

			let o_payload = i_response.payload;

			updatestatus(o_payload);
		});

		let error = appWindow.listen("theme-error", function(i_response) {

			let o_payload = i_response.payload;

			updatestatus(o_payload, true);
		});

		let done = appWindow.listen("theme-done", function(i_response) {
			
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
			<Navigation active={"theme"} working={working}/>
			<div className="container">
				<div className="layout-hbox flex">
					<div className="form flex">
						<fieldset disabled={working}>
							<legend>Info</legend>
							<div className="field-wrapper">
								<label className="field-label" htmlFor="theme">Theme:</label>
								<input className="field-input" ref={inputRef} onChange={props.onThemeChange} value={state.theme} name="theme"></input>
							</div>
						</fieldset>
						<fieldset disabled={working}>
							<legend>Server</legend>
							<div className="field-wrapper">
								<label className="field-label" htmlFor="host">Host:</label>
								<input className="field-input" onChange={props.onInputChange} value={state.host} name="host"></input>
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
								<label className="field-label" htmlFor="password">IceBreak IFS:</label>
								<input className="field-input" onChange={props.onInputChange} value={state.icebreak} name="icebreak"></input>
							</div>
							<div className="field-wrapper">
								<label className="field-label" htmlFor="password">IFS:</label>
								<input className="field-input" onChange={props.onInputChange} value={state.ifs} name="ifs"></input>
							</div>
						</fieldset>
						<fieldset disabled={working}>
							<legend>Action</legend>
							<div className="field-wrapper">
								<label className="field-label" htmlFor="build">Build:</label>
								<input type="checkbox" onChange={props.onCheckChange} checked={state.build} className="field-input" name="build"></input>
							</div>
							<div className="field-wrapper">
								<label className="field-label" htmlFor="update">Update:</label>
								<input type="checkbox" onChange={props.onCheckChange} checked={state.update} className="field-input" name="update"></input>
							</div>
							<div className="field-wrapper">
								<label className="field-label" htmlFor="clean">Clean:</label>
								<input type="checkbox" onChange={props.onCheckChange} checked={state.clean} className="field-input" name="clean"></input>
							</div>
							<div className="field-wrapper">
								<label className="field-label" htmlFor="export">Zip:</label>
								<input type="checkbox" onChange={props.onCheckChange} checked={state.zip} className="field-input" name="zip"></input>
							</div>
							<div className="field-wrapper">
								<label className="field-label" htmlFor="export">Export:</label>
								<input type="checkbox" onChange={props.onCheckChange} checked={state.export} className="field-input" name="export"></input>
							</div>
						</fieldset>
						{packages.length > 0 &&
							<fieldset disabled={working} className="flex overflow-auto">
								<legend>Packages</legend>
								{
									packages.map(function(o_config) {
										return <div key={o_config.name} className="field-wrapper">
											<input type="checkbox" checked={isSelected(o_config.name)} onChange={props.onPackageChange} className="field-input maring-right-20" name={o_config.name}></input>
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
		
	);
}

export default Theme;