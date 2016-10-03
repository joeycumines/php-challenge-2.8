/*
 This is a simple implementation of the to do box.

 ES6 is required.
 */

/**
 * Stores all the current to do items.
 * @type {Array}
 */
class Todo extends React.Component {
    constructor() {
        super();
        this.state = {
            editing: false,
            newTitle: ''
        };
        this.toggleCompleted = this.toggleCompleted.bind(this);
        this.editTitle = this.editTitle.bind(this);
        this.startEditing = this.startEditing.bind(this);
        this.stopEditing = this.stopEditing.bind(this);
        this.onEdit = this.onEdit.bind(this);
        this.onEditKeyPress = this.onEditKeyPress.bind(this);
        this.onDelete = this.onDelete.bind(this);
    }

    onEditKeyPress(e) {
        var event = e || window.event;
        var charCode = event.which || event.keyCode;

        if (charCode == '13') {
            var newTitle = this.state.newTitle.trim();
            if (newTitle) {
                this.stopEditing();
                this.props.updateTodo(newTitle, null);
            }
        }
    }

    toggleCompleted() {
        //console.log("toggle "+this.props.title);
        this.props.updateTodo(null, !this.props.completed);
    }

    editTitle(title) {
        this.props.updateTodo(title, null);
    }

    startEditing() {
        //console.log('Started editing');
        this.setState({editing: true, newTitle: this.props.title});
    }

    stopEditing() {
        this.setState({editing: false});
    }

    onEdit(event) {
        this.setState({newTitle: event.target.value});
    }

    onDelete(event) {
        this.props.deleteTodo();
    }

    render() {
        var completedButton = (
            <span onClick={this.toggleCompleted} className="input-group-addon makePointer uncompletedTodo">
                TODO
            </span>
        );
        if (this.props.completed) {
            completedButton = (
                <span onClick={this.toggleCompleted} className="input-group-addon makePointer">
                    DONE
                </span>
            );
        }
        var title = (
            <span className="list-group-item todoTitle makePointer" onDoubleClick={this.startEditing}>
                {this.props.title}
            </span>
        );
        if (this.props.completed) {
            title = (
                <span className="list-group-item todoTitle makePointer" onDoubleClick={this.startEditing}>
                    <s>{this.props.title}</s>
                </span>
            );
        }
        if (this.state.editing) {
            title = (
                <input onBlur={this.stopEditing} onChange={this.onEdit} onKeyPress={this.onEditKeyPress}
                       type="text" className="form-control todoTitle greyedBackground" value={this.state.newTitle}/>
            );
        }

        var viewMode = '';

        //Hide if completed and view mode active
        //hide if not completed and view mode completed
        if (this.props.completed){
            if (this.props.viewMode == 1)
                viewMode = 'noItems';
        } else {
            if (this.props.viewMode == 2)
                viewMode = 'noItems';
        }


        //<div class="input-group-btn" />
        return (

            <div className={"input-group "+viewMode}>
                {completedButton}
                <div>
                    {title}
                </div>
                <div className="input-group-btn">
                    <button type="button" className="btn btn-warning" onClick={this.onDelete}>
                        X
                    </button>
                </div>
            </div>

        );
    }
}

var TodoList = React.createClass({
    render: function () {
        //Render dynamically
        var todoNodes = this.props.data.map(function (todo) {
            //deleteTodo={this.deleteTodo} updateTodo={this.updateTodo}
            var todoDelete = function () {
                return this.props.deleteTodo(todo._id);
            }.bind(this);
            var todoUpdate = function (title, completed) {
                return this.props.updateTodo(todo._id, title, completed);
            }.bind(this);
            return (
                <Todo title={todo.title} _id={todo._id} completed={todo.completed} deleteTodo={todoDelete}
                      updateTodo={todoUpdate} viewMode={this.props.viewMode} />
            );
        }.bind(this));
        return (
            <div className="todoList">
                {todoNodes}
            </div>
        );
    }
});

var TodoForm = React.createClass({
    getInitialState: function () {
        return {title: ''};
    },
    handleTitleChange: function (e) {
        this.setState({title: e.target.value});
    },
    handleSubmit: function (e) {
        e.preventDefault();
        var title = this.state.title.trim();
        if (!title) {
            return;
        }
        //Send request / refresh the box (Callback defined in the parent)
        this.props.onTaskSubmit({title: title});
        this.setState({title: ''});
    },
    render: function () {
        return (
            <form className="todoForm" onSubmit={this.handleSubmit}>
                <div className="form-group">
                    <div className="input-group">
                        <span className="input-group-btn">
                            <button className="btn btn-secondary toggleButton" onClick={this.props.toggleAll}
                                    type="button">Toggle All</button>
                        </span>
                        <input
                            type="text"
                            placeholder="To add a task type a name then press enter"
                            value={this.state.title}
                            onChange={this.handleTitleChange}
                            className="form-control"
                        />
                    </div>
                </div>
            </form>
        );
    }
});


var TodoBox = React.createClass({
    /**
     * Doesnt need to wait for the worker, but wont update anything if there are any workers.
     * @returns {Promise}
     */
    loadTodosFromServer: function () {
        var origObj = this;

        return new Promise(function (fulfill, reject) {
            $.ajax({
                url: origObj.props.url,
                dataType: 'json',
                cache: false,
                success: function (data) {
                    if (!jcumines.isArray(data)) {
                        reject(new Error('Data was not an array.'));
                        return false;
                    }

                    //If we are still updating anything in addition to this then we exit, dont want popping in
                    if (jcumines.worker('todoWorker') > 0) {
                        console.log('We avoided setting the state from the server while operations were running.');
                        fulfill(false);
                        return false;
                    }

                    //Set our state
                    origObj.setState({data: data});
                    fulfill(data);
                }.bind(origObj),
                error: function (xhr, status, err) {
                    console.error(origObj.props.url, status, err.toString());
                    reject(err);
                }.bind(origObj)
            });
        });
    },
    loadTodosThenWaitLoop: function () {
        //We need to make a copy of this that we can access later
        var origObj = this;

        return this.loadTodosFromServer()['catch'](function (err) {
            //Error ignored
            return err;
        }).then(function (r) {
            //wait this.props.pollInterval
            //console.dir(r);
            return jcumines.wait(origObj.props.pollInterval);
        }).then(function (r) {
            //recurse, we have freed the worker by this point
            return origObj.loadTodosThenWaitLoop();
        });
    },
    handleTodoSubmit: function (todo) {
        var origObj = this;

        var optimisticData = origObj.state.data.concat([]);
        var optimisticTodo = {};
        optimisticTodo._id = null;
        optimisticTodo.title = todo.title;
        optimisticTodo.completed = false;
        var toPost = {};
        toPost.title = '' + todo.title;
        toPost = JSON.stringify(toPost);

        //optimistically set the state
        optimisticData.push(optimisticTodo);
        origObj.setState({data: optimisticData});

        //submit the new data (handling changing the state on error)
        jcumines.worker('todoWorker', new Promise(function (fulfill, reject) {

            $.ajax({
                url: origObj.props.url,
                data: toPost,
                type: "POST",
                dataType: 'json',
                success: function (data) {
                    //successful, we dont need to do anything else it will be autoloaded after fulfill
                    fulfill(true);
                }.bind(origObj),
                error: function (xhr, status, err) {
                    //Unable to perform the op, reload from old data then fulfill
                    //console.dir(xhr);
                    console.error(origObj.props.url, status, err.toString());
                    fulfill(true);
                }.bind(origObj)
            });
        })).then(function (r) {
            if (jcumines.worker('todoWorker') <= 0) {
                return jcumines.worker('todoWorker', origObj.loadTodosFromServer());
            } else {
                console.log('avoided reloading from source after update because we were still updating');
                return false;
            }
        });
    },
    getInitialState: function () {
        return {data: []};
    },
    componentDidMount: function () {
        this.loadTodosThenWaitLoop();
        this.setState({viewMode: 0});
    },
    getIndexOfTodo: function (id) {
        for (var x = 0; x < this.state.data.length; x++) {
            var todo = this.state.data[x];
            if (todo._id == id)
                return x;
        }
        return null;
    },
    updateTodo: function (id, title, completed) {
        var origObj = this;
        if (title != null || completed != null) {
            var ind = this.getIndexOfTodo(id);
            if (ind != null) {
                console.log('updating ' + this.state.data[ind].title);

                //Optimistic: toggle it in the data
                var todo = origObj.state.data[ind];
                var data = origObj.state.data.concat([]);
                var toPut = {};
                if (title != null) {
                    data[ind].title = title;
                    toPut.title = title;
                }
                if (completed != null) {
                    data[ind].completed = completed;
                    toPut.completed = completed;
                }
                origObj.setState({data: data});
                toPut = JSON.stringify(toPut);

                return jcumines.worker('todoWorker', new Promise(function (fulfill, reject) {
                    if (todo == null || todo._id == null) {
                        fulfill(true);
                        return;
                    }
                    var itemUrl = origObj.props.url + '/' + todo._id;
                    //console.log(itemUrl);
                    $.ajax({
                        url: itemUrl,
                        dataType: 'json',
                        data: toPut,
                        type: "PUT",
                        cache: false,
                        success: function (result) {
                            fulfill(result);
                        }.bind(origObj),
                        error: function (xhr, status, err) {
                            console.error(origObj.props.url, status, err.toString());
                            console.dir(xhr);
                            fulfill(err);
                        }.bind(origObj)
                    });
                })).then(function (r) {
                    if (jcumines.worker('todoWorker') <= 0) {
                        return jcumines.worker('todoWorker', origObj.loadTodosFromServer());
                    } else {
                        console.log('avoided reloading from source after update because we were still updating');
                        return false;
                    }
                });
            }
        }
        return Promise.resolve(true);
    },
    deleteTodo: function (id) {
        var origObj = this;
        var ind = this.getIndexOfTodo(id);
        if (ind != null) {
            console.log('deleting ' + this.state.data[ind].title);
            //Optimistic: remove it from the state
            var todo = origObj.state.data[ind];
            var data = origObj.state.data.concat([]);
            data.splice(ind, 1);
            origObj.setState({data: data});
            return jcumines.worker('todoWorker', new Promise(function (fulfill, reject) {
                if (todo == null || todo._id == null) {
                    fulfill(true);
                    return;
                }
                var itemUrl = origObj.props.url + '/' + todo._id;
                //console.log(itemUrl);
                $.ajax({
                    url: itemUrl,
                    dataType: 'json',
                    type: "DELETE",
                    cache: false,
                    success: function (result) {
                        fulfill(result);
                    }.bind(origObj),
                    error: function (xhr, status, err) {
                        console.error(origObj.props.url, status, err.toString());
                        fulfill(err);
                    }.bind(origObj)
                });
            })).then(function (r) {
                if (jcumines.worker('todoWorker') <= 0) {
                    return jcumines.worker('todoWorker', origObj.loadTodosFromServer());
                } else {
                    console.log('avoided reloading from source after update because we were still updating');
                    return false;
                }
            });
        }
        return Promise.resolve(true);
    },
    toggleAll: function () {
        var anyIncomplete = false;
        var data = this.state.data.concat([]);
        for (var x = 0; x < data.length; x++) {
            if (!data[x].completed) {
                anyIncomplete = true;
                break;
            }
        }
        if (anyIncomplete) {
            //make all completed
            for (var x = 0; x < data.length; x++) {
                if (!data[x].completed) {
                    this.updateTodo(data[x]._id, null, true);
                }
            }
        } else {
            //make all incomplete
            for (var x = 0; x < data.length; x++) {
                if (data[x].completed) {
                    this.updateTodo(data[x]._id, null, false);
                }
            }
        }
    },
    clearCompleted: function () {
        var data = this.state.data.concat([]);
        for (var x = 0; x < data.length; x++) {
            if (data[x].completed) {
                this.deleteTodo(data[x]._id);
            }
        }
    },
    viewAll: function(){
        this.setState({viewMode: 0});
    },
    viewActive: function(){
        this.setState({viewMode: 1});
    },
    viewCompleted: function(){
        this.setState({viewMode: 2});
    },
    render: function () {

        //build the components at the bottom
        //how many left span
        var leftCount = 0;
        for (var x = 0; x < this.state.data.length; x++) {
            if (!this.state.data[x].completed) {
                leftCount++;
            }
        }
        var itemsLeftNote = 'items left';
        if (leftCount == 1)
            itemsLeftNote = 'item left';
        var howManyLeft = (
            <span className="pull-xs-left">
                {leftCount} {itemsLeftNote}
            </span>
        );

        //Buttons

        var viewAllClass = 'btn-outline-secondary';
        var viewActiveClass = 'btn-outline-secondary';
        var viewCompletedClass = 'btn-outline-secondary';
        if (this.state.viewMode == 1) {
            viewActiveClass = 'btn-outline-primary';
        } else if (this.state.viewMode == 2) {
            viewCompletedClass = 'btn-outline-primary';
        } else
            viewAllClass = 'btn-outline-primary';

        var viewAll = (
            <button onClick={this.viewAll} className={"btn btn-sm " + viewAllClass}>
                All
            </button>
        );
        var viewActive = (
            <button onClick={this.viewActive} className={"btn btn-sm " + viewActiveClass}>
                Active
            </button>
        );
        var viewCompleted = (
            <button onClick={this.viewCompleted} className={"btn btn-sm " + viewCompletedClass}>
                Completed
            </button>
        );

        //Clear completed hyperlink
        var clearCompleted = (
            <a href="#" className="pull-xs-right" onClick={this.clearCompleted}>
                Clear Completed
            </a>
        );

        var footerToolsClass = 'row';
        if (this.state.data.length == 0)
            footerToolsClass = 'row noItems';

        return (
            <div className="todoBox">
                <TodoForm onTaskSubmit={this.handleTodoSubmit} toggleAll={this.toggleAll}/>
                <TodoList data={this.state.data} deleteTodo={this.deleteTodo} updateTodo={this.updateTodo}
                          viewMode={this.state.viewMode}/>
                <div className={footerToolsClass}>
                    <div className="col-xs-4 col-sm-4 col-md-4 col-lg-4">
                        {howManyLeft}
                    </div>
                    <div className="col-xs-4 col-sm-4 col-md-4 col-lg-4">
                        {viewAll} {viewActive} {viewCompleted}
                    </div>
                    <div className="col-xs-4 col-sm-4 col-md-4 col-lg-4">
                        {clearCompleted}
                    </div>
                </div>
            </div>
        );
    }
});
var pageUrl = document.location.pathname.match(/[^\/]+$/);
if (pageUrl != null)
    pageUrl = pageUrl[0] + '/';
else
    pageUrl = '';
ReactDOM.render(
    <TodoBox url={pageUrl+"todo"} pollInterval={2000}/>
    ,
    document.getElementById('contentWidget')
);