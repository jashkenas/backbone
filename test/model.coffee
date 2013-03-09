# Quick Backbone/CoffeeScript tests to make sure that inheritance
# works correctly.

module "CoffeeScript Integration"

test "Inheritance", 4,
  () ->
    class Document extends Backbone.Model

      fullName: ->
        @get('name') + ' ' + @get('surname')

    tempest = new Document
      id      : '1-the-tempest',
      title   : "The Tempest",
      name    : "William"
      surname : "Shakespeare"
      length  : 123

    equal tempest.fullName(), "William Shakespeare"
    equal tempest.get('length'), 123


    class ProperDocument extends Document

      fullName: ->
        "Mr. " + super

    properTempest = new ProperDocument tempest.attributes

    equal properTempest.fullName(), "Mr. William Shakespeare"
    equal properTempest.get('length'), 123
