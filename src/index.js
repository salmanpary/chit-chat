const path=require('path')
const http=require('http')
const express=require('express')
const socketio=require('socket.io')
const Filter=require('bad-words')
const{generateMessage,generateLocationMessage}= require('./utils/messages')
const app=express()
const server=http.createServer(app)
const io=socketio(server)
const port=process.env.PORT||3000
const publicdirectorypath=path.join(__dirname,'../public')
const {adduser,removeuser,getuser,getusersinroom}=require('./utils/users')
app.use(express.static(publicdirectorypath))
const msg='welcome to chat app'
io.on('connection',(socket)=>{
    console.log('new web socket connection');
    socket.on('join',(options,callback)=>{
       const{error,user}= adduser({id:socket.id,...options})
         if(error){
            return callback(error)

         }
        
        socket.join(user.room)
        socket.emit('message',generateMessage('admin',`Welcome to ${user.room}`))
        socket.broadcast.to(user.room).emit('message',generateMessage('admin',`${user.username} has joined`))
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getusersinroom(user.room)
        })

        callback()

    })
    socket.on('sendMessage',(message,callback)=>{
        const user=getuser(socket.id)

        const filter=new Filter()
        if(filter.isProfane(message)){
            return callback('Profanity is not allowed')
        }
        io.to(user.room).emit('message',generateMessage(user.username,message))
        callback()
    
    })
    socket.on('SendLocation',(coords,callback)=>{
        const user=getuser(socket.id)

        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })
    socket.on('disconnect',()=>{
       const user= removeuser(socket.id)
         if(user){
            io.to(user.room).emit('message',generateMessage('admin',`${user.username} has left`))
            io.to(user.room).emit('roomData',{
                room:user.room,
                users:getusersinroom(user.room)
            })
         }
       
    })

})
server.listen(port,()=>{
    console.log('server is up on port'+port)
})