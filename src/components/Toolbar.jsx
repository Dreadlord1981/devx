import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";

function Toolbar(props) {

	return(
		<>
			<div className="toolbar">
				<div className="tbfill" />
				<button disabled={!props.valid} onClick={props.onClearClick}>Clear</button>
				<button disabled={!props.valid} className="primary" onClick={props.onClick}>Ok</button>
			</div>
		</>
	)
}

export default Toolbar;