import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";
import Navigation from "./Navigation";
import Toolbar from "./Toolbar";


function Package(props) {

	let state = props.state
	let options = props.options || [];

	const logRef = useRef(null);
	const inputRef = useRef(null);

	const [working, setWorking] = useState(false);
	const [log, setLog] = useState("");

	function isValid() {
		
		let valid = state.user && state.password && state.host;

		return valid && !working;
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
			...state
		};

		if (o_args.package == "i") {
			o_args.build_icecap = true;
		}
		else if (o_args.package == "p") {
			o_args.build_portfolio = true;
		}

		delete o_args.package;

		await invoke("package", {
			args: o_args
		});
	}

	async function onClearClick() {

		setLog("");
	}

	useEffect(function() {

		let i_promise = invoke("update_title", {title: "Package builder"});

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

	let portfolio = <input type="radio" className="field-input" onChange={props.onInputChange} id="package-p" value="p" name="package"></input>;
	let icecap = <input type="radio" className="field-input" onChange={props.onInputChange} id="package-i" value="i" name="package"></input>;

	if (state.package == "i") {
		icecap = <input type="radio" className="field-input" onChange={props.onInputChange} id="package-i" value="i" name="package" checked></input>
	}

	if (state.package == "p") {
		portfolio = <input type="radio" className="field-input" onChange={props.onInputChange} id="package-p" value="p" name="package" checked></input>
	}

	return (
		<>
			<Navigation active={"package"} working={working}/>
			<div className="container">
				<div className="layout-hbox flex">
					<div className="form flex">
						<fieldset disabled={working}>
							<legend>Sever</legend>
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
						</fieldset>
						<fieldset disabled={working}>
							<legend>Package</legend>
							<div className="field-wrapper">
								<label className="field-label" htmlFor="package-i">Icecap:</label>
								{icecap}
							</div>
							<div className="field-wrapper">
								<label className="field-label" htmlFor="package-p">Portfolio:</label>
								{portfolio}
							</div>
						</fieldset>
					</div>
					<div className="layout-fit flex">
						<div className="output flex" ref={logRef}>
							<pre>
								{log}
							</pre>
						</div>
					</div>
				</div>
				<Toolbar onClearClick={onClearClick} onClick={onClick} valid={isValid()}/>
			</div>
		</>
	);
}

export default Package;