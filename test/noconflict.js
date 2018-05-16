(function(QUnit) {
  QUnit.module('Backbone.noConflict');

  QUnit.test('noConflict', (assert) => {
    assert.expect(2);
    const noconflictBackbone = Backbone.noConflict();
    assert.equal(window.Backbone, undefined, 'Returned window.Backbone');
    window.Backbone = noconflictBackbone;
    assert.equal(window.Backbone, noconflictBackbone, 'Backbone is still pointing to the original Backbone');
  });
})(QUnit);
