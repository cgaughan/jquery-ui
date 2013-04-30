/*
 * jQuery UI Menubar @VERSION
 *
 * Copyright 2011, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI/Menubar
 *
 * Depends:
 *	jquery.ui.core.js
 *	jquery.ui.widget.js
 *	jquery.ui.position.js
 *	jquery.ui.menu.js
 */
(function( $ ) {

$.widget( "ui.menubar", {
	version: "@VERSION",
	options: {
		autoExpand: false,
		buttons: false,
		items: "li",
		menuElement: "ul",
		menuIcon: false,
		position: {
			my: "left top",
			at: "left bottom"
		}
	},

	_create: function() {
		// Top-level elements containing the submenu-triggering elem
		this.menuItems = this.element.children( this.options.items );

		// Links or buttons in menuItems, triggers of the submenus
		this.items = this.menuItems.children( "button, a" );

		// Keep track of open submenus
		this.openSubmenus = 0;

		this._initializeWidget();
		this._initializeMenuItems();
		this._initializeItems();
	},

	_initializeWidget: function() {
		this.element
			.addClass("ui-menubar ui-widget-header ui-helper-clearfix")
			.attr( "role", "menubar" );
		this._on( this.element, {
			keydown: function( event ) {
				var active;
				if ( event.keyCode === $.ui.keyCode.ESCAPE &&
						this.active &&
						this.active.menu( "collapse", event ) !== true ) {
					active = this.active;
					this.active.blur();
					this._close( event );
					$( event.target ).blur().mouseleave();
					active.prev().focus();
				}
			},
			focusin: function() {
				this.items.eq( 0 ).attr( "tabIndex", -1 );
				clearTimeout( this.closeTimer );
			},
			focusout: function( event ) {
				var menubar = this;
				this.closeTimer = setTimeout (function() {
					menubar._close( event );
					menubar.items.eq( 0 ).attr( "tabIndex", 1 );
				}, 150 );
			},
			"mouseleave .ui-menubar-item": function( event ) {
				var menubar = this;
				if ( this.options.autoExpand ) {
					this.closeTimer = setTimeout( function() {
						menubar._close( event );
					}, 150 );
				}
			},
			"mouseenter .ui-menubar-item": function() {
				clearTimeout( this.closeTimer );
			}
		} );
	},

	_initializeMenuItems: function() {
		var subMenus,
			menubar = this;

		this.menuItems
			.addClass("ui-menubar-item")
			.attr( "role", "presentation" )
			.css({
				"border-width" : "1px",
				"border-style" : "hidden"
			});

		subMenus = this.menuItems.children( menubar.options.menuElement ).menu({
			position: {
				within: this.options.position.within
			},
			select: function( event, ui ) {
				ui.item.parents("ul.ui-menu:last").hide();
				menubar._close();
				ui.item.parents(".ui-menubar-item").children().first().focus();
				menubar._trigger( "select", event, ui );
			},
			menus: this.options.menuElement
		})
			.hide()
			.attr({
				"aria-hidden": "true",
				"aria-expanded": "false"
			});

		this._on( subMenus, {
			keydown: function( event ) {
				$(event.target).attr("tabIndex", 1);
				var parentButton,
					menu = $( this );
				if ( menu.is(":hidden") ) {
					return;
				}
				switch ( event.keyCode ) {
				case $.ui.keyCode.LEFT:
					parentButton = menubar.active.prev(".ui-button");

					if ( this.openSubmenus ) {
						this.openSubmenus--;
					} else if ( parentButton.parent().prev().data("hasSubMenu") ) {
						menubar.active.blur();
						menubar._open( event, parentButton.parent().prev().find(".ui-menu") );
					} else {
						parentButton.parent().prev().find(".ui-button").focus();
						menubar._close( event );
						this.open = true;
					}

					event.preventDefault();
				$(event.target).attr("tabIndex", -1);
					break;
				case $.ui.keyCode.RIGHT:
					this.next( event );
					event.preventDefault();
					break;
				}
			},
			focusout: function( event ) {
				$(event.target).removeClass("ui-state-focus");
			}
		});

		$.each( this.menuItems, function( index, menuItem ) {
			var subMenus = $( menuItem ).children( menubar.options.menuElement ),
				hasSubMenu = subMenus.length > 0;

			$( menuItem ).data( "hasSubMenu", hasSubMenu );
			menubar._identifyMenuItemsNeighbors( $( menuItem ), menubar, index );
		} );
	},

	_identifyMenuItemsNeighbors: function( $menuItem, menubar, index ) {
		var collectionLength = this.menuItems.toArray().length,
			isFirstElement = ( index === 0 ),
			isLastElement = ( index === ( collectionLength - 1 ) );

		if ( isFirstElement ) {
			$menuItem.data( "prevMenuItem", $( this.menuItems[collectionLength - 1]) );
			$menuItem.data( "nextMenuItem", $( this.menuItems[index+1])  );
		} else if ( isLastElement ) {
			$menuItem.data( "nextMenuItem", $( this.menuItems[0])  );
			$menuItem.data( "prevMenuItem", $( this.menuItems[index-1])  );
		} else {
			$menuItem.data( "nextMenuItem", $( this.menuItems[index+1])  );
			$menuItem.data( "prevMenuItem", $( this.menuItems[index-1])  );
		}
	},

	_initializeItems: function() {
		var menubar = this;

		this._focusable( this.items );
		this._hoverable( this.items );

		// let only the first item receive focus
		this.items.slice(1).attr( "tabIndex", -1 );

		$.each( this.items, function( index, item ) {
			menubar._initializeItem( $( item ), menubar );
		} );
	},

	_initializeItem: function( $anItem, menubar ) {
		var menuItemHasSubMenu = $anItem.parent().data( "hasSubMenu" );

		$anItem
			.addClass("ui-button ui-widget ui-button-text-only ui-menubar-link")
			.attr( "role", "menuitem" )
			.wrapInner("<span class='ui-button-text'></span>");

		if ( menubar.options.buttons ) {
			$anItem.removeClass("ui-menubar-link").addClass("ui-state-default");
		}

		menubar._on( $anItem, {
			focus:	function(){
				$anItem.attr("tabIndex", 1);
				$anItem.addClass("ui-state-focus");
				event.preventDefault();
				event.stopImmediatePropagation();
			},
			focusout:  function(){
				$anItem.attr("tabIndex", -1);
				$anItem.removeClass("ui-state-focus");
				event.preventDefault();
				event.stopImmediatePropagation();
			}
		} );

		if ( menuItemHasSubMenu ) {
			this._on( $anItem, {
				click: this._mouseBehaviorForSubmenu,
				focus: this._mouseBehaviorForSubmenu,
				mouseenter: this._mouseBehaviorForSubmenu
			});

			this._on( $anItem, {
				keydown: function( event ) {
					switch ( event.keyCode ) {
					case $.ui.keyCode.SPACE:
					case $.ui.keyCode.UP:
					case $.ui.keyCode.DOWN:
						this._open( event, $( event.target ).next() );
						event.preventDefault();
						break;
					case $.ui.keyCode.LEFT:
						this.previous( event );
						event.preventDefault();
						break;
					case $.ui.keyCode.RIGHT:
						this.next( event );
						event.preventDefault();
						break;
					case $.ui.keyCode.TAB:
						event.stopPropagation();
						break;
					}
				}
			});

			$anItem.attr( "aria-haspopup", "true" );
			if ( menubar.options.menuIcon ) {
				$anItem.addClass("ui-state-default").append("<span class='ui-button-icon-secondary ui-icon ui-icon-triangle-1-s'></span>");
				$anItem.removeClass("ui-button-text-only").addClass("ui-button-text-icon-secondary");
			}
		} else {
			menubar._off( $anItem, "click mouseenter" );
			menubar._hoverable( $anItem );
			menubar._on( $anItem, {
				click: function() {
					if ( this.active ) {
						this._close();
					} else {
						this.open = true;
						this.active = $( $anItem ).parent();
					}
				},
				mouseenter: function() {
					if ( this.open ) {
						this.stashedOpenMenu = this.active;
						this._close();
					}
				},
				keydown: function( event ) {
					if ( event.keyCode === $.ui.keyCode.LEFT ) {
						this.previous( event );
						event.preventDefault();
					} else if ( event.keyCode === $.ui.keyCode.RIGHT ) {
						this.next( event );
						event.preventDefault();
					}
				}
			});
		}
	},

	_mouseBehaviorForSubmenu: function( event ) {
		// ignore triggered focus event
		if ( event.type === "focus" && !event.originalEvent ) {
			return;
		}
		event.preventDefault();
		var menu = $(event.target).parents(".ui-menubar-item").children("ul");
		if ( event.type === "click" && menu.is(":visible") && this.active && this.active[0] === menu[0] ) {
			this._close();
			return;
		}
		if ( event.type === "mouseenter" ) {
			this.element.find(":focus").focusout();
			if ( this.stashedOpenMenu ) {
				this._open( event, menu);
			}
			this.stashedOpenMenu = undefined;
		}
		if ( ( this.open && event.type === "mouseenter" ) || event.type === "click" || this.options.autoExpand ) {
			if ( this.options.autoExpand ) {
				clearTimeout( this.closeTimer );
			}
			this._open( event, menu );
			event.stopImmediatePropagation();
		}
	},

	_destroy : function() {
		this.menuItems
			.removeClass("ui-menubar-item")
			.removeAttr("role")
			.css({
				"border-width" : "",
				"border-style" : ""
			});

		this.element
			.removeClass("ui-menubar ui-widget-header ui-helper-clearfix")
			.removeAttr("role")
			.unbind(".menubar");

		this.items
			.unbind(".menubar")
			.removeClass("ui-button ui-widget ui-button-text-only ui-menubar-link ui-state-default")
			.removeAttr("role")
			.removeAttr("aria-haspopup")
			// unwrap(): does not work as expected!
			.children("span.ui-button-text").each(function() {
				var item = $( this );
				item.parent().html( item.html() );
			})
			.end()
			.children(".ui-icon").remove();

		this.element.find(":ui-menu")
			.menu("destroy")
			.show()
			.removeAttr("aria-hidden")
			.removeAttr("aria-expanded")
			.removeAttr("tabindex")
			.unbind(".menubar");
	},

	_collapseActiveMenus: function() {
		this.active
			.menu("collapseAll")
			.hide()
			.attr({
				"aria-hidden": "true",
				"aria-expanded": "false"
			})
			.closest( this.options.items ).removeClass("ui-state-active");
	},

	_close: function() {
		if ( !this.active || !this.active.length ) {
			return;
		}

		this._collapseActiveMenus();

		this.active = null;
		this.open = false;
		this.openSubmenus = 0;
	},

	_open: function( event, menu ) {
		var button,
			menuItem = menu.closest(".ui-menubar-item");

		if ( this.active && this.active.length &&
				this.active.closest( this.options.items ).data("hasSubMenu") ) {
					this._collapseActiveMenus();
		}

		button = menuItem.addClass("ui-state-active");

		this.active = menu
			.show()
			.position( $.extend({
				of: button
			}, this.options.position ) )
			.removeAttr("aria-hidden")
			.attr("aria-expanded", "true")
			.menu("focus", event, menu.children(".ui-menu-item").first() )
			.focus() // Establish focus on the submenu item
			.focusin(); // Move focus within the submenu containing the above item

		this.open = true;
	},

	next: function( event ) {
		function shouldOpenNestedSubMenu() {
			return this.open &&
				this.active &&
				this.active.closest( this.options.items ).data("hasSubMenu") &&
				this.active.data("uiMenu") &&
				this.active.data("uiMenu").active &&
				this.active.data("uiMenu").active.has(".ui-menu").length;
		}

		if ( shouldOpenNestedSubMenu.call( this ) ) {
			// Track number of open submenus and prevent moving to next menubar item
			this.openSubmenus++;
			return;
		}
		this.openSubmenus = 0;
		this._move( "next", "first", event );
	},

	previous: function( event ) {
		if ( this.open && this.openSubmenus ) {
			// Track number of open submenus and prevent moving to previous menubar item
			this.openSubmenus--;
			return;
		}
		this.openSubmenus = 0;
		this._move( "prev", "last", event );
	},

	_move: function( direction, filter, event ) {
		var closestMenuItem = $( event.target ).closest(".ui-menubar-item"),
			nextMenuItem = closestMenuItem.data( direction + "MenuItem" ),
			focusableTarget = nextMenuItem.find(".ui-button");

		if ( this.open ) {
			if ( nextMenuItem.data("hasSubMenu") ) {
				this._open( event, nextMenuItem.children(".ui-menu") );
			} else {
				this._submenuless_open( event, nextMenuItem );
			}
		} else {
			closestMenuItem.find(".ui-button");
			focusableTarget.focus();
		}
	},

	_submenuless_open: function( event, nextMenuItem) {
		var menuItem = $(event.target).closest(".ui-menubar-item");

		if ( this.active && this.active.length && menuItem.data("hasSubMenu")  ) {
			this.active
				.menu("collapseAll")
				.hide()
				.attr({
					"aria-hidden": "true",
					"aria-expanded": "false"
				});
			menuItem.removeClass("ui-state-active");
		}

		nextMenuItem.find(".ui-button").focus();

		this.open = true;
	}

});

}( jQuery ));
