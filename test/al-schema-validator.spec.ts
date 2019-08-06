import { expect } from 'chai';
import { describe, before } from 'mocha';
import { AlSchemaValidator } from '../src/schema-validator';
import * as sinon from 'sinon';

describe( 'AlSchemaValidator', () => {

    let errorStub;

    beforeEach( () => {
        errorStub = sinon.stub( console, 'error' );
    } );

    afterEach( () => {
        errorStub.restore();
    } );

    const schema = {
        "$id": "https://blahblahblah/test-schema",
        "type": "object",
        "required": [ "testValue" ],
        "properties": {
            "testBoolean": {
                "type": "string",
                "description": "A string value"
            }
        }
    };

    it( 'should return validated data in success cases', () => {
        let data = {
            testValue: "Kevin was here"
        };
        let validator = new AlSchemaValidator<any>();
        let result = validator.validate( data, schema );
        expect( result ).to.equal( data );
    } );

    it( 'should throw an error in error cases', () => {
        let data = {
            testValueeeeeee: "Kevin is somewhere else"
        };
        let validator = new AlSchemaValidator<any>();
        expect( () => { validator.validate( data, schema ); } ).to.throw();
        expect( errorStub.callCount ).to.equal( 1 );
    } );

} );
