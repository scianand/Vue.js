package main

import (
	"flag"
	"log"
	"net/http"
	"os"
	"os/signal"
	"runtime"

	"github.com/gin-gonic/gin"
)

var port string

func init() {
	gin.SetMode(gin.ReleaseMode)
	if runtime.GOOS == "windows" {
		gin.DisableConsoleColor()
	}
	gracefulExit()
	flag.StringVar(&port, "port", "27281", "port to listen on")
	log.SetPrefix("[SRV] ")
	log.SetFlags(log.LstdFlags)
}

// checkError
func ce(err error, msg string) {
	if err != nil {
		log.Panicln(msg, err)
	}
}

func gracefulExit() {
	quit := make(chan os.Signal)
	signal.Notify(quit, os.Interrupt)
	go func() {
		<-quit
		os.Exit(0)
	}()
}
func main() {
	flag.Parse()
	r := gin.Default()
	r.Use(gin.Recovery())
	r.StaticFS("/", http.Dir("./public"))

	hostname, err := os.Hostname()
	ce(err, "os.Hostname")
	log.Printf("Listening on http://%[1]s:%[2]s/ , http://localhost:%[2]s/\n", hostname, port)
	err = r.Run(":" + port)
	ce(err, "http.ListenAndServe")
}
