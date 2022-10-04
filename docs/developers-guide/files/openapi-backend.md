# Open API Specification Backend
This document describes the backend for generating an OpenAPI document from Morphir sources.

### Definitions
And OpenAPI document that conforms to the OpenAPI specification is a JSON
object which could be represented either as JSON or YAML. An OpenAPI document must contain either of the following:
* a paths field
* a component field (or a webhook field)
* a webhooks field

We intend to generate an OAS document focusing on the components.

### The OpenAPI Object
This is the root object of the OpenAPI document. It has two mandatory fields:
* openapi
* info

Example of an OpenAPI object is given below 
### Primitives and Objects Example

```json
{
  "openapi" : "foo version",
  "info" : {
    "title" : "foo title",
    "version" : "v1.0.0"
  },
  "components" : {
    "schemas" : {
      "email" : {
        "type" : "string"
      },
      "fullname" : {
        "type" : "object",
        "properties" : {
          "firstname" : {
            "type" : "string" 
          },
          "lastname" : {
            "type" : "string"
          }
        }
      }
    }
  }
}
```

### Working With Arrays
An array is a list of items. This is similar the Json Schema.
However, the items field MUST be present if the type of the schema is array.


### Working With Custom Types
JSON does not directly support this data type.