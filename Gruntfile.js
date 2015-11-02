module.exports = function(grunt){

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),        

        copy: {
            build:{ 
                files: [
                    {
                    cwd: 'src/',
                    src: '**',
                    dest: 'build/',
                    expand: true
                    },
                    {
                    cwd: 'bower_components/comment-core-library/build/',
                    src: 'CommentCoreLibrary.min.js',
                    dest: 'build/',
                    expand: true
                    },
                    {
                    cwd: 'bower_components/comment-core-library/build/',
                    src: 'style.min.css',
                    dest: 'build/',
                    expand: true,
                    rename: function(dest, src) {
                        return dest + 'CommentCoreLibrary.min.css';
                    }
                    },
                ]
            }
        },

        babel: {
            options: {
                presets: ['react']
            },
            dist: {
                files: {
                    'build/player.js': 'build/player.jsx'
                }
            }
        },

        clean: ['build/player.jsx']
    });

    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-babel');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.registerTask('bower_install', 'Install bower dependencies', function() {
        var bower = require('bower');
        done = this.async();

        bower.commands.install()
            .on('log', function(data) {
                grunt.log.writeln(data.message);
            })
            .on('end', function(results){
                done();        
            }
            );
    });

    grunt.registerTask(
        'default', ['bower_install', 'copy', 'babel', 'clean']
    );
};
