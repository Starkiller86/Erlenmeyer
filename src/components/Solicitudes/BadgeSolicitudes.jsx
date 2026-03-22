// src/components/BadgeSolicitudes.jsx
export function BadgeSolicitudes({ contador }) {
    if (contador === 0) return null;

    return (
        <span style={{
            position: "absolute",
            top: "-6px",
            right: "-6px",
            background: "red",
            color: "white",
            borderRadius: "50%",
            width: "20px",
            height: "20px",
            fontSize: "11px",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        }}>
            {contador > 9 ? "9+" : contador}
        </span>
    );
}