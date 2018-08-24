let binary = wasmTextToBinary(`
(module
    (func (export "add") (result i32) (param i32) (param i32)
     get_local 0
     get_local 1
     i32.add
    )

    (func (export "no_arg") (result i32)
     i32.const 42
     i32.const 58
     i32.add
    )

    (global $g (mut i32) (i32.const 0))

    (func (export "set_global_one") (param i32)
     get_local 0
     set_global $g
    )

    (func (export "set_global_two") (param i32) (param i32)
     get_local 0
     get_local 1
     i32.add
     set_global $g
    )

    (func (export "glob") (result i32)
     get_global $g
    )
)
`);

os.file.writeTypedArrayToFile('./binary.wasm', new Uint8Array(binary));
