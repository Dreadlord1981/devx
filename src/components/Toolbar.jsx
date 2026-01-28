function Toolbar(props) {

	return (
		<div className="toolbar">
			<div className="tbfill" />
			<button onClick={props.onClearClick}>
				Clear
			</button>
			<button disabled={!props.valid} className="primary" onClick={props.onClick}>
				Ok
			</button>
		</div>
	)
}

export default Toolbar;