let binary = wasmTextToBinary(`
(module
    (import $Math_cos "Math" "cos" (result f32) (param f32))
    (import $js_import "glob" "jsAdd" (result i32) (param i32) (param i32))

    (func (export "cos") (param $i i32)
     loop $top
       get_local $i
       f32.reinterpret/i32
       call $Math_cos
       drop

       get_local $i
       i32.const 1
       i32.sub
       tee_local $i
       i32.const 0
       i32.ne
       if
        br $top
       end
     end
    )

    (func (export "calljs") (param $i i32)
     loop $top
       get_local $i
       get_local $i
       call $js_import
       drop

       get_local $i
       i32.const 1
       i32.sub
       tee_local $i
       i32.const 0
       i32.ne
       if
        br $top
       end
     end
    )

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

    (func (export "if_add") (result i32) (param i32) (param i32)
     get_local 0
     i32.const 1
     i32.add
     i32.const 0
     i32.ne
     if
        get_local 0
        get_local 1
        i32.add
        return
     end
     get_local 0
    )
)
`);

os.file.writeTypedArrayToFile('./binary.wasm', new Uint8Array(binary));
