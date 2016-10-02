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

    render() {
        var completedButton = (
            <span onClick={this.toggleCompleted} className="input-group-addon makePointer">
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
        if (this.state.editing) {
            title = (
                <input onBlur={this.stopEditing} onChange={this.onEdit} onKeyPress={this.onEditKeyPress}
                       type="text" className="form-control todoTitle greyedBackground" value={this.state.newTitle}/>
            );
        }
        //<div class="input-group-btn" />
        return (

            <div className="input-group">
                {completedButton}
                <div>
                    {title}
                </div>
                <div className="input-group-btn">
                    <button type="button" className="btn btn-warning" onClick={this.props.deleteTodo}>
                        X
                    </button>
                </div>
            </div>

        );
    }
}
var testButton = 0;
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
                      updateTodo={todoUpdate}/>
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
                    <input
                        type="text"
                        placeholder="To add a task type a name then press enter"
                        value={this.state.title}
                        onChange={this.handleTitleChange}
                        className="form-control"
                    />
                </div>
            </form>
        );
    }
});


var TodoBox = React.createClass({
    loadTodosFromServer: function () {
        var origObj = this;

        return new Promise(function (fulfill, reject) {
            $.ajax({
                url: origObj.props.url,
                dataType: 'json',
                cache: false,
                success: function (data) {
                    if (!jcumines.isArray(data))
                        reject(new Error('Data was not an array.'));
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

        //Exit if we have items in the work queue
        if (jcumines.worker('todoWorker') > 0) {
            console.log('Avoiding starting a reload while operating...');
            return jcumines.wait(1000).then(function (r) {
                return origObj.loadTodosThenWaitLoop();
            });
        }


        return jcumines.worker('todoWorker', this.loadTodosFromServer()['catch'](function (err) {
            //Error ignored
            return err;
        })).then(function (r) {
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

        //submit the new data (handling changing the state on error)
        jcumines.worker('todoWorker', new Promise(function (fulfill, reject) {

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
            }
        });
    },
    getInitialState: function () {
        return {data: []};
    },
    componentDidMount: function () {
        this.loadTodosThenWaitLoop();
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
                return jcumines.worker('todoWorker', new Promise(function (fulfill, reject) {

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

            return jcumines.worker('todoWorker', new Promise(function (fulfill, reject) {

                //Optimistic: remove it from the state
                var todo = origObj.state.data[ind];
                var data = origObj.state.data.concat([]);
                data.splice(ind, 1);
                origObj.setState({data: data});

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
                }
            });
        }
        return Promise.resolve(true);
    },
    render: function () {
        return (
            <div className="todoBox">
                <TodoForm onTaskSubmit={this.handleTodoSubmit}/>
                <TodoList data={this.state.data} deleteTodo={this.deleteTodo} updateTodo={this.updateTodo}/>
            </div>
        );
    }
});

ReactDOM.render(
    <TodoBox url="/todo" pollInterval={10000}/>
    ,
    document.getElementById('contentWidget')
);